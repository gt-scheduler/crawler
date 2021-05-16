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

It operates as a series of *steps* that are processed after one another (see [`src/index.ts`](/src/index.ts)) for each current "term" (combination of year and semester, i.e. Fall 2021).

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

After the crawler runs (which can take 10-20 minutes), a series of JSON files should have been created in a new `data` directory in the project root.

## 👩‍💻 Contributing

The GT Scheduler project welcomes (and encourages) contributions from the community. Regular development is performed by the project owners (Jason Park and [Bits of Good](https://bitsofgood.org/)), but we still encourage others to work on adding new features or fixing existing bugs and make the registration process better for the Georgia Tech community.

More information on how to contribute can be found [in the contributing guide](/CONTRIBUTING.md).
