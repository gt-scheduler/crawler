# GT Schedule Crawler

> A periodic web crawler to feed course data into [GT Scheduler](https://bitsofgood.org/scheduler).

Sample: [202008.json](https://gt-scheduler.github.io/crawler/202008.json)

To report a bug or request a new feature, please [create a new Issue in the GT Scheduler website repository](https://github.com/gt-scheduler/website/issues/new/choose).

## 📃 License & Copyright Notice

This work is a derivative of the original and spectacular [GT Schedule Crawler](https://github.com/64json/gt-schedule-crawler) project created by Jinseo Park (as a part of the overall [GT Scheduler](https://github.com/64json/gt-scheduler) project). The original work and all modifications are licensed under the [AGPL v3.0](https://github.com/64json/gt-scheduler/blob/master/LICENSE) license.

### Original Work

Copyright (c) 2020 Jinseo Park (parkjs814@gmail.com)

### Modifications

Copyright (c) 2020 the Bits of Good "GT Scheduler" team

## 🔍 Overview

The crawler is a command-line application written in [TypeScript](https://www.typescriptlang.org/) (a typed superset of JavaScript) that runs using Node.js to crawl schedule data from [Oscar](https://oscar.gatech.edu/) (Georgia Tech's registration management system).

It operates as a series of _steps_ that are processed after one another (see [`src/index.ts`](/src/index.ts)) for each current "term" (combination of year and semester, i.e. Fall 2021).

In order to process the prerequisites data for each course (which comes in the form of a string like "Undergraduate Semester level CS 2340 Minimum Grade of C and Undergraduate Semester level LMC 3432 Minimum Grade of C" that can become much more complex), the crawler also utilizes an [ANTLR](https://www.antlr.org/) grammar and generated parser in order to convert the prerequisites data retrieved from Oscar into a normalized tree structure. The grammar itself and the generated parser/lexer code can be found in the [`src/steps/prereqs/grammar`](/src/steps/prereqs/grammar) folder.

The crawler is run every 30 minutes using a [GitHub Action workflow](/.github/workflows/crawling.yml), which then publishes the resultant JSON to the `gh-pages` where it can be downloaded by the frontend app: https://gt-scheduler.github.io/crawler/202008.json.

## 🚀 Running Locally

- [Node.js](https://nodejs.org/en/) (any recent version will probably work)
- Installation of the [`yarn` package manager](https://classic.yarnpkg.com/en/docs/install/) **version 1** (support for version 2 is untested)

### Running the crawler

After cloning the repository to your local computer, run the following command in the repo folder:

```
yarn install
```

This may take a couple minutes and will create a new folder called `node_modules` with all of the dependencies installed within. This only needs to be run once.

Then, to run the crawler, run:

```
yarn start
```

After the crawler runs, a series of JSON files should have been created in a new `data` directory in the project root.

#### Utilizing structured logging

By default, the crawler outputs standard log lines to the terminal in development. However, it also supports outputting structured JSON log events that can be more easily parsed and analyzed when debugging. This is turned on by default when the crawler is running in a GitHub Action (where the `LOG_FORMAT` environment variable is set to `json`), but it can also be enabled for development.

The utility script `yarn start-logged` can be used to run the crawler and output JSON log lines to a logfile in the current working directory:

```
yarn start-logged
```

To analyze the JSON log lines data, I recommend using [`jq`](https://stedolan.github.io/jq/) since it is a powerful tool for parsing/analyzing JSON in the shell. The following command imports all lines in the latest log file and loads them all as one large array for further processing (**note**: this command will probably only work on Unix-like systems (Linux and probably macOS), so your mileage may vary. If you're running into issues, try running it on a Linux computer and make sure you have [`jq` installed](https://stedolan.github.io/jq/)):

```sh
cat $(find . -type f -name "*.log" | sort -n | tail -1) | jq -cs '.'
```

For some useful queries on the log data, see [📚 Useful queries on crawler logs](https://github.com/gt-scheduler/crawler/wiki/%F0%9F%93%9A-Useful-queries-on-crawler-logs).

### Using the Python Finals Data Scraper

First, ensure [Python 3.9 or newer](https://www.python.org/downloads/) is installed. Then, install the necessary Python modules with the included `requirements.txt` file:

```
pip install -r requirements.txt
```

Run the reviser to augment the data previously scraped with the new finals data

```
python ./src/Revise.py
```

The JSON files in the `data` folder will now contain updated information regarding the finals date and time.

More information can be found [here](https://github.com/gt-scheduler/crawler/wiki/Finals-Scraping#process)

#### Updating the list of finals PDFs

The Registrar publishes a PDF with the Finals schedule at the start of each semester.
The page with the PDF for the Fall 2022 semester can be found [here](https://registrar.gatech.edu/info/final-exam-matrix-fall-2022)

The `matrix.json` file contains a mapping from term to the pdf file.
<br>The key is one of the terms identified by the scraper [here](https://gt-scheduler.github.io/crawler/index.json).
<br>The value is the direct address for the PDF file such as [this](https://registrar.gatech.edu/files/202208%20Final%20Exam%20Matrix.pdf)

This mapping needs to be updated each semester when a new schedule is posted

More information can be found on the [wiki](https://github.com/gt-scheduler/crawler/wiki/Finals-Scraping)

### Linting

The project uses pre-commit hooks using [Husky](https://typicode.github.io/husky/#/) and [`lint-staged`](https://www.npmjs.com/package/lint-staged) to run linting (via [ESLint](https://eslint.org/)) and formatting (via [Prettier](https://prettier.io/)). These can be run manually from the command line to format/lint the code on-demand, using the following commands:

- `yarn run lint` - runs ESLint and reports all linting errors without fixing them
- `yarn run lint:fix` - runs ESLint and reports all linting errors, attempting to fix any auto-fixable ones
- `yarn run format` - runs Prettier and automatically formats the entire codebase
- `yarn run format:check` - runs Prettier and reports formatting errors without fixing them

## 👩‍💻 Contributing

The GT Scheduler project welcomes (and encourages) contributions from the community. Regular development is performed by the project owners (Jason Park and [Bits of Good](https://bitsofgood.org/)), but we still encourage others to work on adding new features or fixing existing bugs and make the registration process better for the Georgia Tech community.

More information on how to contribute can be found [in the contributing guide](/CONTRIBUTING.md).
