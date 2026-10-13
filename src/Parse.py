#!/usr/bin/env python
# coding: utf-8
import tabula
import re
import numpy as np
import pandas as pd
from datetime import datetime
import json
from pathlib import Path
from typing import *
import PyPDF2
import requests
import os 

# More documentation available: https://github.com/gt-scheduler/crawler/wiki/Finals-Scraping#revise

MATRIX_FILE_PATH = Path("./src/matrix.json").resolve().absolute()

# RegEx for date (i.e. "Monday, Dec 12")
dateSearch = re.compile(r"\w+,\s\w+\s\d+")
# RegEx for time range (i.e. "8:00 AM - 10:50 AM")
timeSearch = re.compile(r"\d+:\d\d\s[PA]M\s*(‐|-)\s*\d+:\d\d [PA]M")
# RegEx for title (i.e. "8:00 AM - 10:50 AM Exams")
titleSearch = re.compile(r"\d+:\d\d [AP]M\s+(‐|-)\s+\d+:\d\d\s[AP]M\sExams")

class Parser:
    def __init__(self):
        self.dateFormat = "%b %d, %Y"
        self.schedule = pd.DataFrame()
        self.read = None
        self.common = pd.DataFrame()

    def cropPdf(self, input_path, output_path, left=16.4 * 72, bottom=0 * 72, right=1 * 72, top=11 * 72):
        """
        Crop a PDF file using PyPDF2 by adjusting the visible bounding box.

        Some finals PDFs contain headers, footers, or extraneous whitespace that confuse
        downstream parsing logic. Cropping reduces errors and noise in the extracted data.
        """
        with open(input_path, 'rb') as file:
          reader = PyPDF2.PdfReader(file)
          writer = PyPDF2.PdfWriter()

          for page_num in range(len(reader.pages)):
              page = reader.pages[page_num]
              page.mediabox.lower_left = (left, bottom)
              page.mediabox.upper_right = (right, top)
              writer.add_page(page)

          with open(output_path, 'wb') as output_file:
              writer.write(output_file)
    
    def convertTimeGroup(self, time_group: str) -> str:
        """
        Converts a time group to a 24-hour format
        eg: "10:20am - 2:50pm" -> "1020 - 1450"
        """
        matching_groups = re.findall(r"((\d{1,2}):(\d{2}) (a|p)m)", time_group)
        if matching_groups == None or len(matching_groups) != 2: return "TBA"
        converted_times = []
        for time in matching_groups:
            if len(time) != 4: return "TBA"
            [_, hour, minute, ampm] = time
            new_hour = str(int(hour) % 12 + (12 if ampm == 'p' else 0))
            new_hour = new_hour if len(new_hour) == 2 else f"0{new_hour}"
            converted_times.append(f"{new_hour}{minute}")
        return " - ".join(converted_times)

    def setFirstRowAsHeader(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Take the first row of a DataFrame as column names and 
        return the DataFrame with remaining rows as data.
        """
        df.columns = df.iloc[0]
        df = df.drop(df.index[0])
        df = df.reset_index(drop=True)
        
        return df

    def parseBlock(self, block, version):
        """
        A block is a chunk of PDF-extracted text representing a single exam time slot, 
        typically starting with "<start time> - <end time> Exams" followed by rows of class schedules 
        with days, class times, and optional course dates (may include line breaks or NaNs).

        e.g.

           2:40 PM - 5:30 PM Exams                            Unnamed: 0
        0                     Days                      Class Start Time
        1          F2:00 PM3:55 PM     Monday, Apr 28\r2:40 PM - 5:30 PM
        2          F2:00 PM4:45 PM                                   NaN
        3         F8:00 AM10:45 AM    Thursday, May 1\r2:40 PM - 5:30 PM
        4         F8:25 AM10:20 AM                                   NaN
        5       MTWR2:00 PM2:50 PM     Friday, Apr 25\r2:40 PM - 5:30 PM
        6      MWF\r2:00 PM2:50 PM                                   NaN
        7         MW2:00 PM2:50 PM                                   NaN
        ...
        """

        def date (n: re.Match):
            nonlocal sectionDate
            raw_date = n.group()
            formats = [
                "%m/%d",        # numeric month/day, e.g., "12/09"
                "%m-%d",        # numeric with dash, e.g., "12-09"
                "%A, %b %d",    # abbreviated month name, e.g., "Tuesday, Dec 9"
                "%A, %B %d"     # full month name, e.g., "Tuesday, December 9"
            ]

            for fmt in formats:
                try:
                    parsed_date = datetime.strptime(raw_date, fmt)
                    parsed_date = parsed_date.replace(year=self.year)
                    sectionDate = parsed_date.strftime(self.dateFormat)
                    return
                except ValueError:
                    continue

            # no formats matched
            print(f"Warning: Could not parse date '{raw_date}'")
            sectionDate = None
            
        def time (n: re.Match):
            nonlocal sectionTime
            if not sectionTime:
                group = n.group().lower()
                sectionTime = self.convertTimeGroup(group)
        
        if version == 1:
            block.columns = ["Days", "Time"]
            # Tabula combines the Start Time, End Time, and Exam Date/Time columns
            # Requires regex to split them apart
            sectionDate = ""
            sectionTime = ""
            hyphen = re.compile(r"(?<=[ap]m)\s(?=\d)")

            # Each row represents a class meeting with 'Days' (e.g., "MW", "TRF") and 'Time' (start and end times, 
            # sometimes including the exam date or extra time ranges), e.g., 
            # Days="MW", Time="6:30 PM 7:20 PM" or Days="T", Time="5:00 PM 6:55 PM Tuesday, Dec 9".
            for index, row in block.iterrows():
                # Add the finals date/time as a separate column
                try:
                    row[1] = dateSearch.sub(date, row[1])
                    row[1] = timeSearch.sub(time, row[1])
                    row[1] = hyphen.sub(" - ", row[1].lower())
                    row[1] = self.convertTimeGroup(row[1])
                except Exception as e:
                    print(f"Error parsing row: {e}")
                    pass
                block.loc[index, 'finalDate'] = sectionDate
                block.loc[index, 'finalTime'] = sectionTime

            # Go back and add the first row's time
            block['finalTime'].iloc[0] = block['finalTime'].iloc[1]
            return block
        elif version == 2:
            # check if the title for the block was parsed as a column name or a row
            for c in block.columns:
                if titleSearch.match(c):
                    break
            else:
                block = block.drop(index=[0])
                block = block.reset_index(drop=True)

            block = block.drop(index=0)
            block = block.reset_index(drop=True)

            block.columns = ["Days", "Time"]

            sectionDate = ""
            sectionTime = ""

            def split_schedule(schedule):
                # Matches schedule lines like "TR8:00 AM9:15 AM" to capture days, start time, and end time
                pattern = r'([A-Za-z]+)\s*\r?\s*(\d{1,2}:\d{2} [AP]M)\s*(\d{1,2}:\d{2} [AP]M)'
                matches = re.match(pattern, schedule)
                if matches:
                    days = matches.group(1)
                    start_time = matches.group(2)
                    end_time = matches.group(3)
                    return days, start_time, end_time
                else:
                    return None, None, None

            # split data into the four different columns 
            for index, row in block.iterrows(): 
                days, start_time, end_time = split_schedule(row[0])
                if not pd.isna(row[1]):
                    row[1] = dateSearch.sub(date, row[1])
                    row[1] = timeSearch.sub(time, row[1])

                block.loc[index, 'finalDate'] = sectionDate
                block.loc[index, 'finalTime'] = sectionTime
                block.loc[index, 'Days'] = days
                block.loc[index, 'Time'] = self.convertTimeGroup(f"{start_time.lower()} - {end_time.lower()}")

            return block
        else:
            print("Unknown parser version")


    def parseCommon(self):
        """
        Parse the time slots for the common
        exams at the bottom of the schedule
        """
        if self.read is None:
            print("File was not foundd")
            return None

        df=None
        for chunk in self.read:
            # Find the chunk with the common exams
            if "Common Exams" in chunk.columns: df=chunk.copy()
        if df is None: return None

        df = self.setFirstRowAsHeader(df)
        df.dropna(axis=1, how='all', inplace=True)

        try:
            tempdf = df.copy()
            tempdf.columns = ['Course', 'Date']
            for index, row in tempdf.iterrows(): 
                # Matches a course name or 'None' followed by a date like "Thurs, Apr 25", capturing (course(s), date).
                match = re.match(r'(None|.+?)([A-z]{3,5}, \w{3} \d{1,2})', row[0])

                if match:
                    tempdf.loc[index, 'Course'] =  match.group(1)
                    tempdf.loc[index, 'Time'] = row[1]
                    tempdf.loc[index, 'Date'] = match.group(2)
            df = tempdf.copy()
        except Exception as e:
            pass

        def strip_carriage_return(s):
          return s.replace('\r', '')
        df = df[['Course', 'Date', 'Time']]

        df['Course'] = df['Course'].apply(strip_carriage_return)
        df['Date'] = df['Date'].apply(strip_carriage_return)
        df['Time'] = df['Time'].apply(strip_carriage_return)

        df['Time'] = df['Time'].str.lower().apply(self.convertTimeGroup)
        df = df.loc[df['Course'] != "None"]

        # Change date format from day, month date
        # to month date, year
        day = re.compile(r"\w+(?=,)")
        def convert(val, day):
            string = day.sub(lambda match: match.group()[:3],val)
            try:
                date = datetime.strptime(string, "%a, %b %d").replace(year=self.year).strftime("%b %d, %Y")
            except ValueError:
                # Full month name was used (e.x. July instead of Jul)
                date = datetime.strptime(string, "%a, %B %d").replace(year=self.year).strftime("%b %d, %Y")
            return date
        df['Date'] = df['Date'].apply(lambda val: convert(val, day))

        # Explode comma separated courses
        df['Course'] = df['Course'].map(lambda x: x.split(", "))
        df = df.explode(column="Course").reset_index(drop=True)

        # Explode courses combined with /
        def splitCourse(string):
            course = string.split()[0]
            numbers = string.split()[1].split("/")
            return ["{} {}".format(course, number) for number in numbers]
        df['Course'] = df['Course'].map(splitCourse)
        df = df.explode(column="Course").set_index('Course')
        df = df.apply(lambda x: x.str.strip()).apply(lambda x: x.str.replace("‐", "-"))
        self.common = df

    def export(self, title="Finals Schedule"):
        """
        Export the data to a CSV file
        """
        if self.schedule is not None:
            self.schedule.to_csv("./data/{}.csv".format(title))
        else:
            print("Schedule has not been parsed")
    
class ParserV1(Parser):
    """
    Parser class for PDFs from 202308, 202505, and 202508

    ParserV1 handles matrix PDFs where:
    - Tabula splits pages into uneven chunks
    - Columns may be merged incorrectly
    - Schedules have Days/Time columns combined with Exam Date/Time
    """
    def __init__(self):
        super().__init__()

    def parseFile(self, file="202208"):
        """
        Parse a single file into `self.schedule`, a Pandas DataFrame
        Takes a single parameter which is a key in matrix.json
        """
        self.year = int(file[0:4])

        print(f"Parsing file: {file}")

        # TODO: CHANGE PATH BEFORE COMMITTING
        with open(MATRIX_FILE_PATH) as f:
            locations = json.load(f)
        if file in locations:
            url = locations[file] # address for the PDF
        else:
            print("File was not found")
            return None
        try:
          self.read = tabula.read_pdf(url, pages=1)
        except Exception as e:
          print(f'Tabula was unable to parse the matrix for : {file}')
          print(e)
          return None

        
        schedule = pd.DataFrame()
        sections = set() # Keep track of time blocks already parsed
        for chunk in self.read:
            # Tabula breaks the file up into separate chunks,
            # some containing multiple time slots
            columns = self.getColumns(chunk)
            for start, end, terminate in columns:
              df = chunk.iloc[:terminate, start:end+1]

              # Fix case where tabula breaks the columns incorrectly
              if len(df.columns) == 3:
                df.iloc[:, 1] = df.iloc[:, 1:].fillna("").agg(" ".join, axis=1).apply(str.strip)
                df = df.iloc[:, :-1]

              if df.columns[1] not in sections:
                sections.add(df.columns[1])
                print("Parsing: {}".format(df.columns[1]))
                block = df.drop(index=0).iloc[:, :2].copy()
                block.columns = block.iloc[0]
                schedule = pd.concat([schedule, self.parseBlock(block, 1)], axis=0, join="outer")
        schedule = schedule.apply(lambda x: x.str.strip()).apply(lambda x: x.str.replace("‐", "-"))
        schedule.set_index(['Days', 'Time'], inplace=True)
        self.schedule = schedule

    def getColumns(self, block: pd.DataFrame) -> List[List[int]]:
        """_summary_
        Given one block created by tabula, determine which columns to parse
        Tabula breaks the page up into chunks, so uneven boxes can result in
        weird breaks
        Return a list of columns to parse in the format
        [start_column, end_column, end_row]
        """
        
        idxs = []
        for idx, column in enumerate(block.columns):
            if titleSearch.match(column):
                if idx == len(block.columns)-1: idxs.append([idx-1, idx])
                elif isinstance(block.iloc[0, idx+1], str) and "Exam Date/Time" in block.iloc[0, idx+1]:
                    # Check if tabula created an extra column
                    idxs.append([idx-1, idx+1])
                else: idxs.append([idx-1, idx])
                na = block[block.iloc[:, idxs[-1][0]+1].isna()]
                idxs[-1].append(na.index[0] if not na.empty else len(block))
        return idxs


class ParserV2(Parser):
    """
    Parser class for PDFs from 202402

    ParserV2 handles PDFs where:
    - Coordinates are cropped to exclude header and footer for cleaner extraction
    - Tabula may still merge columns, but simpler splitting logic is used
    """
    def __init__(self):
        super().__init__()

    def parseFile(self, file):
        """
        Parse a single file into `self.schedule`, a Pandas DataFrame
        Takes a single parameter which is a key in matrix.json
        """
        self.year = int(file[0:4])
        print(f"Parsing file: {file}")

        with open(MATRIX_FILE_PATH) as f:
            locations = json.load(f)
        if file in locations:
            url = locations[file] # address for the PDF
        else:
            print("File was not found")
            return None
        try:
          response = requests.get(url)
        except Exception as e:
            print(f"Unable to download Finals Matrix for: {file}")
            print(e)
            return None

        with open(f"downloaded_{file}.pdf", 'wb') as f:
          f.write(response.content)

        # coordinates in pdf point system
        top = 16.4 * 72
        left = 0 * 72
        bottom = 1 * 72
        right = 11 * 72

        self.cropPdf(f"downloaded_{file}.pdf", f"cropped_{file}.pdf", left, bottom, right, top)
        self.read = tabula.read_pdf(f"cropped_{file}.pdf", pages=1)
        os.unlink(f"downloaded_{file}.pdf")
        os.unlink(f"cropped_{file}.pdf")
        
        schedule = pd.DataFrame()

        for chunk in self.read:
            if "Reading and Conflict Periods" in chunk.columns or "Common Exams" in chunk.columns:
              continue
            
            schedule = pd.concat([schedule, self.parseBlock(chunk, 2)], axis=0, join="outer")
        
        schedule = schedule.apply(lambda x: x.str.strip()).apply(lambda x: x.str.replace("‐", "-"))
        schedule.set_index(['Days', 'Time'], inplace=True)
        self.schedule = schedule
        
class ParserV3(Parser):
    """
    Parser class for PDFs from 202502

    Similar to ParserV2 but instead crops into left/right halves for easier Tabula extraction
    Can be used if Tabula has trouble with the full page (i.e. combines two tables from left and right side into one)
    """
    def __init__(self):
        super().__init__()

    def parseFile(self, file="202208"):
        """
        Parse a single file into `self.schedule`, a Pandas DataFrame
        Takes a single parameter which is a key in matrix.json
        """
        self.year = int(file[0:4])

        print(f"Parsing file: {file}")

        # Load the matrix.json file to get the URL for the PDF
        with open(MATRIX_FILE_PATH) as f:
            locations = json.load(f)
        if file in locations:
            url = locations[file]  # address for the PDF
        else:
            print("File was not found")
            return None

        try:
            # Download the PDF
            response = requests.get(url)
        except Exception as e:
            print(f"Unable to download Finals Matrix for: {file}")
            print(e)
            return None

        # Save the downloaded PDF
        pdf_path = f"downloaded_{file}.pdf"
        with open(pdf_path, 'wb') as f:
            f.write(response.content)

        reader = PyPDF2.PdfReader(pdf_path)
        page = reader.pages[0]
        page_width = float(page.mediabox.width)
        page_height = float(page.mediabox.height)

        self.cropPdf(f"downloaded_{file}.pdf", f"cropped_left_{file}.pdf", 0, 0, page_width / 2, page_height)
        self.cropPdf(f"downloaded_{file}.pdf", f"cropped_right_{file}.pdf", page_width / 2, 0, page_width, page_height)

        try:
            self.read = tabula.read_pdf(f"cropped_left_{file}.pdf", pages=1)
            self.read.extend(tabula.read_pdf(f"cropped_right_{file}.pdf", pages=1))
        except Exception as e:
            print(f"Tabula was unable to parse the half of the matrix for: {file}")
            print(e)
            return None

        # Clean up the temporary files
        os.unlink(pdf_path)
        os.unlink(f"cropped_left_{file}.pdf")
        os.unlink(f"cropped_right_{file}.pdf")

        # Process the parsed data
        schedule = pd.DataFrame()

        for chunk in self.read:

            chunk = chunk.iloc[:, :2]

            if "Reading and Conflict Periods" in chunk.columns or "Common Exams" in chunk.columns:
                continue
                
            schedule = pd.concat([schedule, self.parseBlock(chunk, 2)], axis=0, join="outer")

        schedule = schedule.apply(lambda x: x.str.strip()).apply(lambda x: x.str.replace("‐", "-"))
        schedule.set_index(['Days', 'Time'], inplace=True)
        self.schedule = schedule