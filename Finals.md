# Finals Schedule Parser

The goal is to parse the PDF provided by Georgia Tech with the semester's finals schedule.

Both a Pandas DataFrame and CSV are generated

## Purpose

Every semester, the registrar will publish a PDF with the schedule for the semester's finals. It can be found on a page like [this](https://registrar.gatech.edu/info/final-exam-matrix-fall-2022) for the Fall 2022 semester.

## Sample Files

- Complete JSON for the 2022 Fall Semester in the updated format can be found [here](https://gt-scheduler.github.io/crawler/202208.json)
- CSV of the parsed Finals PDF can be found [here](https://gt-scheduler.github.io/crawler/202208_Finals.csv)

## Usage

- [`Parse.py`](#parser)
- [`Revise.py`](#revise)

## Parser

Convert the PDF schedule to a DataFrame

**Functions**

- [parseFile](#parsefile)
- [parseCommon](#parsecommon)
- [parseBlock](#parseblock)
- [getColumns](#getcolumns)
- [export](#export)

### parseFile

`parseFile` takes a term number as input and looks it up in `matrix.json` to find the PDF address.

<br>The key is one of the terms identified by the scraper [here](https://gt-scheduler.github.io/crawler/202008.json).
<br>The value is the direct address for the PDF file such as [this](https://registrar.gatech.edu/files/202208%20Final%20Exam%20Matrix.pdf)

Once the file is fetched, it's parsed with Tabula, creating different blocks

The final result is a Pandas DataFrame where the index is a MultiIndex consisting of the _Meeting Days_ and _Timeslot_. The columns are _finalDate_ and _finalTime_.

The result is stored in the property `schedule`

**Example:**
| index| finalDate | finalTime |
|:------------------------------|:-------------|:-------------------|
| ('TR', '8:00 am - 9:15 am') | Dec 15, 2022 | 8:00 am - 10:50 am |
| ('T', '8:00 am - 10:45 am') | Dec 15, 2022 | 8:00 am - 10:50 am |
| ('TWRF', '8:25 am - 9:15 am') | Dec 15, 2022 | 8:00 am - 10:50 am |
| ('TRF', '8:25 am - 9:15 am') | Dec 15, 2022 | 8:00 am - 10:50 am |
| ('TR', '8:25 am - 9:15 am') | Dec 15, 2022 | 8:00 am - 10:50 am |

---

### parseCommon

`parseCommon` will generate a DataFrame with information about courses with the same timeslot for all sections.

The result is stored in the property `common`

**Input Example:**
| | Unnamed: 0 | Common Exams | Unnamed: 1 | TWRF | 5:00 PM | 5:50 PM | Thursday, Dec 8 |
|---:|:-------------------------|:---------------|:------------------|:-------|:----------|:----------|:------------------|
| 0 | Course | Date | Time | TRF | 5:00 PM | 5:50 PM | 6:00 PM ‐ 8:50 PM |
| 1 | ECE 3710, MATH 1551/1552 | Thurs, Dec 8 | 6:00 PM ‐ 8:50 PM | TR | 5:00 PM | 5:50 PM | nan |
| 2 | MATH 1553/1554 | Tues, Dec 13 | 6:00 PM ‐ 8:50 PM | MTWR | 5:00 PM | 5:50 PM | Friday, Dec 9 |

The rows with commas and slashes are separated into identical rows

**Result Example:**

| Course    | Date         | Time              |
| :-------- | :----------- | :---------------- |
| ECE 3710  | Dec 08, 2022 | 6:00 PM - 8:50 PM |
| MATH 1553 | Dec 13, 2022 | 6:00 PM - 8:50 PM |
| MATH 1554 | Dec 13, 2022 | 6:00 PM - 8:50 PM |

---

### parseBlock

The input is a single block parsed by Tabula.

Several steps are done:

- Extracting the date and time into separate columns
- Adding a hyphen to the section time
- Replacing the ‐ with a - in the final time
- Change the date format from `Day, Month Date` to `Month Date, Year`

**Example:**
| | Class Days | Class Start Time Class End Time Exam Date/Time | Class Days | Class Start Time Class End Time Exam Date/Time |
|---:|:-------------|:-------------------------------------------------|:-------------|:-------------------------------------------------|
| 1 | TR | 8:00 AM 9:15 AM Thursday, Dec 15 | TWRF | 12:30 PM 1:20 PM Thursday, Dec 15 |
| 2 | T | 8:00 AM 10:45 AM 8:00 AM ‐ 10:50 AM | TRF | 12:30 PM 1:20 PM 11:20 AM ‐ 2:10 PM |
| 3 | TWRF | 8:25 AM 9:15 AM | TR | 12:30 PM 1:20 PM |
| 4 | TR | 8:25 AM 9:15 AM | MWF | 11:00 AM 11:50 AM Friday, Dec 9 |

---

### getColumns

Some chunks created by Tabula contain only half of a finals time block.

**Example:**
| | WF 8:25 AM 9:15 AM | Unnamed: 0 | Unnamed: 1 | Unnamed: 2 | Unnamed: 3 | 6:00 PM ‐ 8:50 PM Exams | Unnamed: 4 |
|---:|:---------------------|:-------------------|-------------:|-------------:|:-------------|:--------------------------------|:------------------|
| 0 | MW 8:25 AM 10:20 AM | nan | nan | nan | Days | Class Start Time Class End Time | Exam Date/Time |
| 1 | M 8:25 AM 10:20 AM | nan | nan | nan | M | 5:00 PM 6:55 PM | Monday, Dec 12 |
| 2 | R 8:25 AM 10:20 AM | nan | nan | nan | M | 5:00 PM 7:45 PM | 6:00 PM ‐ 8:50 PM |

This function's purpose is to determine which columns contain complete blocks to parse. If two blocks are in the same column the function will return the end of the first block

The return format is a list of `[start_column, end_column, last_row]`

---

### export

Will output the main schedule to a csv with name `title`

## Revise

Augment the existing scraped data with information from the parser

### Section

A basic class to handle the information for a single section

### iterFiles

Iterate through the JSON files for each of the terms scraped by the scraper

Attempt to parse the finals information for each term

[Process](#process) each term

---

### Process

For each section, use the meeting time and days to determine when the class's final is

If a timeslot is determined, the previous -1 values are replaced with new indexes to `caches['finalDate']` and `caches['finalTime]`

The list of finalDate and finalTimes are added to the caches

**New section:**

```json
"A": [
    "80684",
    [
        [
            0,
            "MW",
            "Scheller College of Business 224",
            0,
            [
                "Nicole Lena Mackenzie (P)"
            ],
            0,
            1, // Index to caches.finalDates
            0  // Index to caches.finalTimes
        ]
    ],
    3,
    0,
    0,
    [
        0
    ],
    0
],
```

**Update to caches**

```json
"caches": {
    "finalTimes": [
        "11:20 am - 2:10 pm",
        "2:40 pm - 5:30 pm",
        "6:00 pm - 8:50 pm",
        "8:00 am - 10:50 am"
    ],
    "finalDates": [
        "Dec 08, 2022",
        "Dec 09, 2022",
        "Dec 12, 2022",
        "Dec 13, 2022",
        "Dec 14, 2022",
        "Dec 15, 2022"
    ]
}
```
