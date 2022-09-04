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

# More documentation available: https://github.com/gt-scheduler/crawler/wiki/Finals-Scraping#revise

class Parser:
# TODO fix uneven boxes case. don't just ignore repeats, use the longer one. probably just better to use multi index
    def __init__(self):
        self.dateFormat = "%b %d, %Y"
        self.schedule = pd.DataFrame()
        self.read = None
        self.common = pd.DataFrame()

    # Date format
    def setDateFormat(self, string: str):
        self.dateFormat = string

    def parseBlock(self, block: pd.DataFrame) -> pd.DataFrame:
        """
        Parse a single time block
        """
        block.columns = ["Days", "Time"]
        # Tabula combines the Start Time, End Time, and Exam Date/Time columns
        # Requires regex to split them apart
        sectionDate = ""
        sectionTime = ""
        dateSearch = re.compile(r"\w+,\s\w+\s\d+")
        timeSearch = re.compile(r"\d+:\d\d\s[PA]M\s*‐\s*\d+:\d\d [PA]M")
        hyphen = re.compile(r"(?<=[ap]m)\s(?=\d)")

        def date (n: re.Match):
            nonlocal sectionDate
            try:
                date = datetime.strptime(n.group(), "%A, %b %d")
            except ValueError:
                # Full month name was used
                date = datetime.strptime(n.group(), "%A, %B %d")
            date = date.replace(year=self.year)
            sectionDate = date.strftime(self.dateFormat)
            return ""

        def time (n: re.Match):
            nonlocal sectionTime
            if sectionTime: return ""
            sectionTime = n.group().lower()
            return ""

        for index, row in block.iterrows():
            # Add the finals date/time as a separate column
            try:
                row[1] = dateSearch.sub(date, row[1])
                row[1] = timeSearch.sub(time, row[1])
                row[1] = hyphen.sub(" - ", row[1].lower())
            except:
                print(block)
                print()
                print(row)
                print(row[1])
                raise Exception
            block.loc[index, 'finalDate'] = sectionDate
            block.loc[index, 'finalTime'] = sectionTime

        # Go back and add the first row's time
        block['finalTime'].iloc[0] = block['finalTime'].iloc[1]
        return block

    def getColumns(self, block: pd.DataFrame) -> List[List[int]]:
        """_summary_
        Given one block created by tabula, determine which columns to parse
        Tabula breaks the page up into chunks, so uneven boxes can result in
        weird breaks
        Return a list of columns to parse in the format
        [start_column, end_column, end_row]
        """
        titleSearch = re.compile(r"\d+:\d\d [AP]M\s+‐\s+\d+:\d\d\s[AP]M\sExams")
        idxs = []
        for idx, column in enumerate(block.columns):
            if titleSearch.match(column):
                if idx == len(block.columns)-1: idxs.append([idx-1, idx])
                elif "Exam Date/Time" in block.iloc[0, idx+1]:
                    # Check if tabula created an extra column
                    idxs.append([idx-1, idx+1])
                else: idxs.append([idx-1, idx])
                na = block[block.iloc[:, idxs[-1][0]+1].isna()]
                idxs[-1].append(na.index[0] if not na.empty else len(block))
        return idxs

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
        # Cut to size
        df.columns=df.iloc[0, :]
        df.drop(inplace=True, index=0)
        df = df[['Course', 'Date', 'Time']]
        df['Time'] = df['Time'].str.lower()
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

    def parseFile(self, file="202208"):
        """
        Parse a single file into `self.schedule`, a Pandas DataFrame
        Takes a single parameter which is a key in matrix.json
        """
        self.year = int(file[0:4])
        print(f"Parsing file: {file}")
        with open(Path("./src/matrix.json").resolve().absolute()) as f:
            locations = json.load(f)
        if file in locations:
            file = locations[file] # address for the PDF
        else:
            print("File was not found")
            return None

        self.read = tabula.read_pdf(file, pages=1)
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
                    schedule = pd.concat([schedule, self.parseBlock(block)], axis=0, join="outer")

        schedule = schedule.apply(lambda x: x.str.strip()).apply(lambda x: x.str.replace("‐", "-"))
        schedule.set_index(['Days', 'Time'], inplace=True)
        self.schedule = schedule

    def export(self, title="Finals Schedule"):
        """
        Export the data to a CSV file
        """
        if self.schedule is not None:
            self.schedule.to_csv("./data/{}.csv".format(title))
        else:
            print("Schedule has not been parsed")
