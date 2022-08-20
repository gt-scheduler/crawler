#!/usr/bin/env python
# coding: utf-8

from tabula import *
from tabulate import tabulate
import regex as re
import numpy as np
import pandas as pd
#reads table from pdf file
copy = read_pdf("src/202205 Final Exam Matrix Full.pdf",pages="all") #address of pdf file
schedule = pd.DataFrame()


read = copy.copy()


def parseBlock(block: pd.DataFrame) -> pd.DataFrame:
    print(block.columns)
    block.columns = ["Days", "Time"]
    sectionDate = ""
    sectionTime = ""
    dateSearch = re.compile(r"\w+,\s\w+\s\d+")
    timeSearch = re.compile(r"\d+:\d\d\s[PA]M\s*‐\s*\d+:\d\d [PA]M")
    hyphen = re.compile(r"(?<=[ap]m)\s(?=\d)")
    def date (n: re.Match):
        nonlocal sectionDate
        sectionDate = n.group()
        return ""

    def time (n: re.Match):
        nonlocal sectionTime
        sectionTime = n.group().lower()
        return ""

    for index, row in block.iterrows():
        if not row[1]:
            block.drop(index=index, inplace=True)
            continue
        row[1] = dateSearch.sub(date, row[1])
        row[1] = timeSearch.sub(time, row[1])
        row[1] = hyphen.sub(" - ", row[1].lower())
        block.loc[index, 'testDate'] = sectionDate
        block.loc[index, 'testTime'] = sectionTime

    # Go back and add first row time
    block['testTime'].iloc[0] = block['testTime'].iloc[1]
    # print(block)
    return block


schedule = pd.DataFrame()
sections = set()
for df in read:
    if "Common Exams" in df.columns: break
    # Fix case where reader breaks the columns incorrectly
    if len(df.columns) == 5:
        df.iloc[:, 3] = df.iloc[:, 3:].fillna("").agg(" ".join, axis=1).apply(str.strip)
        df = df.iloc[:, :-1]
    

    if df.columns[1] not in sections:
        sections.add(df.columns[1])
        print("Parsing: {}".format(df.columns[1]))
        block = df.drop(index=0).iloc[:, :2].copy()
        block.columns = block.iloc[0]
        schedule = schedule.append(parseBlock(block))

    if df.columns[3] not in sections:
        sections.add(df.columns[3])
        print("Parsing: {}".format(df.columns[3]))
        block = df.drop(index=0).iloc[:, 2:].copy()
        block.columns = block.iloc[0]
        schedule = schedule.append(parseBlock(block))


schedule.to_csv("Finals Schedule.csv")

