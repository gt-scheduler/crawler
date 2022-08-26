#!/usr/bin/env python
# coding: utf-8

from tabula import *
from tabulate import tabulate
import re
import numpy as np
import pandas as pd
from datetime import datetime
import json
from typing import *

#reads table from pdf file
year=2022
month="05"


class Parser:
# TODO fix uneven boxes case. don't just ignore repeats, use the longer one. probably just better to use multi index
    def __init__(self, year=2022):
        self.dateFormat = "%b %d, %Y"
        self.year = year
        self.schedule = pd.DataFrame()
        self.read = None
        self.common = pd.DataFrame()

    # Date format
    def setDateFormat(self, string: str):
        self.dateFormat = string

    def parseBlock(self, block: pd.DataFrame) -> pd.DataFrame:
        block.columns = ["Days", "Time"]
        sectionDate = ""
        sectionTime = ""
        dateSearch = re.compile(r"\w+,\s\w+\s\d+")
        timeSearch = re.compile(r"\d+:\d\d\s[PA]M\s*‐\s*\d+:\d\d [PA]M")
        hyphen = re.compile(r"(?<=[ap]m)\s(?=\d)")
        def date (n: re.Match):
            nonlocal sectionDate
            date = datetime.strptime(n.group(), "%A, %b %d")
            date = date.replace(year=self.year)
            sectionDate = date.strftime(self.dateFormat)
            return ""

        def time (n: re.Match):
            nonlocal sectionTime
            if sectionTime: return ""
            sectionTime = n.group().lower()
            return ""

        for index, row in block.iterrows():
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

        # Go back and add first row time
        block['finalTime'].iloc[0] = block['finalTime'].iloc[1]
        return block

    def getColumns(self, block: pd.DataFrame) -> List[List[int]]:
        titleSearch = re.compile(r"\d+:\d\d [AP]M\s+‐\s+\d+:\d\d\s[AP]M\sExams")
        idxs = []
        for idx, column in enumerate(block.columns):
            if titleSearch.match(column):
                if idx == len(block.columns)-1: idxs.append([idx-1, idx])
                elif "Exam Date/Time" in block.iloc[0, idx+1]:
                    idxs.append([idx-1, idx+1])
                else: idxs.append([idx-1, idx])
                na = block[block.iloc[:, idxs[-1][0]+1].isna()]
                idxs[-1].append(na.index[0] if not na.empty else len(block))
        return idxs

    def parseCommon(self):
        if self.read is None:
            print("File was not foundd")
            return None

        df=None
        for chunk in self.read:
            if "Common Exams" in chunk.columns: df=chunk
        if df is None: return None
        # Cut to size
        df.columns=df.iloc[0, :]
        df.drop(inplace=True, index=0)
        df = df[['Course', 'Date', 'Time']]
        df = df.loc[df['Course'] != "None"]

        # Change date format
        day = re.compile(r"\w+(?=,)")
        def convert(val, day):
            string = day.sub(lambda match: match.group()[:3],val)
            return datetime.strptime(string, "%a, %b %d").replace(year=year).strftime("%b %d, %Y")
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

    def parseFile(self, file="202209") -> pd.DataFrame:
        print(f"Parsing file: {file}")
        with open("./matrix.json") as f:
            locations = json.load(f)
        if file in locations:
            file = locations[file]
        else:
            print("File was not found")
            return None

        self.read = read_pdf(file) #address of pdf file
        schedule = pd.DataFrame()
        sections = set()
        for chunk in self.read:
            columns = self.getColumns(chunk)
            for start, end, terminate in columns:
                df = chunk.iloc[:terminate, start:end+1]

                # Fix case where reader breaks the columns incorrectly
                if len(df.columns) == 3:
                    df.iloc[:, 1] = df.iloc[:, 1:].fillna("").agg(" ".join, axis=1).apply(str.strip)
                    df = df.iloc[:, :-1]

                if df.columns[1] not in sections:
                    sections.add(df.columns[1])
                    print("Parsing: {}".format(df.columns[1]))
                    block = df.drop(index=0).iloc[:, :2].copy()
                    block.columns = block.iloc[0]
                    schedule = schedule.append(self.parseBlock(block))

        # schedule['finalTime'] = schedule['finalTime'].str.replace("‐", "-")
        # schedule['Time'] = schedule['Time'].str.replace("‐", "-")

        schedule = schedule.apply(lambda x: x.str.strip()).apply(lambda x: x.str.replace("‐", "-"))
        # schedule.reset_index(inplace=True, drop=True)
        schedule.set_index(['Days', 'Time'], inplace=True)
        self.schedule = schedule

    def export(self, title="Finals Schedule"):
        if self.schedule is not None:
            self.schedule.to_csv("{}.csv".format(title))
        else:
            print("Schedule has not been parsed")

    def getData(self) -> pd.DataFrame:
        return self.schedule


# parser = Parser()
# parser.parseFile("202208")
# parser.parseCommon()
# schedule = parser.schedule
# common = parser.common




