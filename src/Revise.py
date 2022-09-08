#!/usr/bin/env python
# coding: utf-8

from Parse import Parser
import json
from typing import Tuple
import pandas as pd
import numpy as np
from pathlib import Path
import re

# More documentation available: https://github.com/gt-scheduler/crawler/wiki/Finals-Scraping#revise

class Section:
    cache = None

    def __init__(self, data):
        if len(data[1]) == 0: raise LookupError("No Section Information")
        info = data[1][0]
        periodIdx, days = info[0], info[1]
        # Find the period by using the provided periodIdx
        # into the periods cache
        period = self.cache['periods'][periodIdx]

        self.period: str = period
        self.days: str = days
        self.obj = data

    def set(self, idx, val):
        self.obj[1][0][idx] = val


class Revise:

    def __init__(self):
        self.iterFiles()

    def iterFiles(self):
        # Attempt to get the finals information for each term
        for file in Path("./data/").resolve().absolute().iterdir():
            parser = Parser()
            if not re.match(r"\d+\.json", file.name): continue
            self.file = file
            parser.parseFile(file.stem)
            parser.parseCommon()
            parser.export("{}_Finals".format(file.stem))
            self.schedule = parser.schedule
            self.common = parser.common
            self.process()
        print("Finished all files")

    def process(self):
        """
        Revise the scraped JSON for a single term
        """

        # Load the current term
        with open(self.file) as f:
            data = json.load(f)
        # Create a list of unique final dates/times
        dates = np.sort(np.unique(np.concatenate([self.schedule['finalDate'].unique(), self.common['Date'].unique()]) if not self.schedule.empty else np.array([])))
        times =         np.unique(np.concatenate([self.schedule['finalTime'].unique(), self.common['Time'].unique()]) if not self.schedule.empty else np.array([]))
        data['caches']['finalTimes'] = times.tolist()
        data['caches']['finalDates'] = dates.tolist()

        def lookup(days, period) -> pd.Series:
            # find the final date/time given class days/period
            if not self.schedule.index.isin([(days, period)]).any(): return None
            row=self.schedule.loc[days, period]
            return row

        lab = re.compile(r"\d")
        Section.cache = data['caches']
        for course, courseData in data['courses'].items():
            for sectionTitle, sectionData in courseData[1].items():
                # Skip lab sections (sections with numbers)
                if lab.search(sectionTitle):
                    continue
                try:
                    section = Section(sectionData)
                except:
                    pass
                else:
                    # Check if the course has a common finals time
                    if course in self.common.index:
                        row = self.common.loc[course]
                        dateIdx = int(np.where(dates == row['Date'])[0][0])
                        timeIdx = int(np.where(times == row['Time'])[0][0])
                        section.set(6, dateIdx)
                        section.set(7, timeIdx)
                        continue

                    row = lookup(section.days, section.period)
                    if row is not None:
                        dateIdx = int(np.where(dates == row['finalDate'])[0][0])
                        timeIdx = int(np.where(times == row['finalTime'])[0][0])
                        section.set(6, dateIdx)
                        section.set(7, timeIdx)
                        continue

        with open(self.file, "w") as f:
            json.dump(data, f)


Revise()




