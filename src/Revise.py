#!/usr/bin/env python
# coding: utf-8

from Parse import Parser
import json
from typing import Tuple
import pandas as pd
import numpy as np
from pathlib import Path
import re


class Section:
    cache = None

    def __init__(self, data):
        if len(data[1]) == 0: raise LookupError("No Section Information")
        info = data[1][0]
        periodIdx, days = info[0], info[1]
        period = self.cache['periods'][periodIdx]

        self.period: str = period
        self.days: str = days
        self.obj = data

    def add(self, val):
        self.obj[1][0].append(val)



class Revise:

    def __init__(self):
        self.iterFiles()

    def iterFiles(self):
        parser = Parser()
        for file in Path("../data/").iterdir():
            if not re.match(r"\d+\.json", file.name): continue
            self.file = file
            parser.parseFile(file.stem)
            parser.parseCommon()
            self.schedule = parser.schedule
            self.common = parser.common
            self.process()

    def process(self):
        with open(self.file) as f:
            data = json.load(f)
        dates = np.concatenate([self.schedule['finalDate'].unique(), self.common['Date'].unique()]) if not self.schedule.empty else np.array([])
        times = np.concatenate([self.schedule['finalTime'].unique(), self.common['Time'].unique()]) if not self.schedule.empty else np.array([])
        data['caches']['finalTimes'] = times.tolist()
        data['caches']['finalDates'] = dates.tolist()

        def lookup(days, period) -> pd.Series:
            if not self.schedule.index.isin([(days, period)]).any(): return None
            row=self.schedule.loc[days, period]
            return row

        Section.cache = data['caches']
        for course, courseData in data['courses'].items():
            for sectionTitle, sectionData in courseData[1].items():
                try:
                    section = Section(sectionData)
                except:
                    pass
                else:
                    if course in self.common.index:
                        row = self.common.loc[course]
                        dateIdx = int(np.where(dates == row['Date'])[0][0])
                        timeIdx = int(np.where(times == row['Time'])[0][0])
                        section.add(dateIdx)
                        section.add(timeIdx)
                        continue

                    row = lookup(section.days, section.period)
                    if row is not None:
                        dateIdx = int(np.where(dates == row['finalDate'])[0][0])
                        timeIdx = int(np.where(times == row['finalTime'])[0][0])
                        section.add(dateIdx)
                        section.add(timeIdx)
                        continue

                section.add(-1)
                section.add(-1)

        with open(self.file.with_name("asdf.json"), "w") as f:
            json.dump(data, f, indent=4)


Revise()




