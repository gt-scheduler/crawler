import asyncPool from "tiny-async-pool";
import {
  download,
  list,
  parse,
  downloadCourseDetails,
  attachDescriptions,
  attachPrereqs,
  write,
  parseCourseDescription,
  parseCoursePrereqs,
  writeIndex,
} from "./steps";
import Log from "./log";
import { getIntConfig } from "./utils";

import type { Prerequisites } from "./types";

// Current scraped JSON version
const CURRENT_VERSION = 2;

// Number of terms to scrape (scrapes most recent `NUM_TERMS`)
const NUM_TERMS = getIntConfig("NUM_TERMS") ?? 2;

// IO Concurrency to download files using.
// This is a completely arbitrary number.
const DETAILS_CONCURRENCY = getIntConfig("DETAILS_CONCURRENCY") ?? 128;

async function main(): Promise<void> {
  let logFormat: "text" | "json" = "text";
  const rawLogFormat = process.env["LOG_FORMAT"];
  if (rawLogFormat !== undefined) {
    if (rawLogFormat === "text" || rawLogFormat === "json") {
      logFormat = rawLogFormat;
    } else {
      // TODO use different log level here.
      Log.warn(`invalid log format provided`, { logFormat: rawLogFormat });
      process.exit(1);
    }
  }
  Log.configure({ format: logFormat });

  Log.info(`starting crawler`, {
    currentVersion: CURRENT_VERSION,
    numTerms: NUM_TERMS,
    detailsConcurrency: DETAILS_CONCURRENCY,
    logFormat,
  });

  try {
    const crawlingTimer = Log.startTimer();
    await crawl();
    crawlingTimer.done("finished crawling Oscar");
    process.exit(0);
  } catch (err) {
    Log.error(`a fatal error occurred while running the crawler`, err);
    process.exit(1);
  }
}

async function crawl(): Promise<void> {
  const listTimer = Log.startTimer();
  const terms = await list();
  const recentTerms = terms.slice(0, NUM_TERMS);
  listTimer.done("finished listing all terms", {
    terms,
    recentTerms,
    desiredNumTerms: NUM_TERMS,
  });

  // Scrape each term in parallel
  await Promise.all(
    recentTerms.map(async (term) => {
      // Set the base fields that are added to every span
      const termSpanFields: Record<string, unknown> = {
        term,
        version: CURRENT_VERSION,
      };

      const termCrawlTimer = Log.startTimer();
      await crawlTerm(term, termSpanFields);
      termCrawlTimer.done("finished crawling term", termSpanFields);
    })
  );

  // Output a JSON file containing all of the scraped term files
  await writeIndex();
}

async function crawlTerm(
  term: string,
  baseSpanFields: Record<string, unknown>
): Promise<void> {
  // Alias the parameter so we can modify it
  let spanFields = baseSpanFields;

  // Download the term HTML page containing every course.
  const downloadTimer = Log.startTimer();
  const html = await download(term);
  downloadTimer.done("finished downloading term", spanFields);

  const parsingTimer = Log.startTimer();
  const termData = await parse(html, CURRENT_VERSION);
  parsingTimer.done(`parsing term data to JSON`, spanFields);

  const allCourseIds = Object.keys(termData.courses);
  const courseIdCount = allCourseIds.length;
  spanFields = { ...spanFields, courseIdCount };
  Log.info(`collected all course ids`, { allCourseIds, ...spanFields });

  const allPrereqs: Record<string, Prerequisites | []> = {};
  const allDescriptions: Record<string, string | null> = {};
  const detailsTimer = Log.startTimer();
  Log.info("");
  await span(
    `downloading & parsing prerequisite info & course descriptions`,
    { ...spanFields, concurrency: DETAILS_CONCURRENCY },
    async () =>
      asyncPool(DETAILS_CONCURRENCY, allCourseIds, async (courseId) => {
        const [coursePrereqs, courseDescription] = await span(
          `crawling individual course`,
          {
            ...spanFields,
            courseId,
          },
          async (setCompletionFields) => {
            const [htmlLength, prereqs, description] = await crawlCourseDetails(
              term,
              courseId
            );
            setCompletionFields({
              htmlLength,
              hasDescription: description != null,
            });
            return [prereqs, description];
          }
        );

        allPrereqs[courseId] = coursePrereqs;
        allDescriptions[courseId] = courseDescription;
      })
  );

  await span(`attaching prereq information`, spanFields, () =>
    attachPrereqs(termData, allPrereqs)
  );

  await span(`attaching course descriptions`, spanFields, () =>
    attachDescriptions(termData, allDescriptions)
  );

  await span(`writing scraped data to disk`, spanFields, () =>
    write(term, termData)
  );
}

async function crawlCourseDetails(
  term: string,
  courseId: string
): Promise<
  [htmlLength: number, prereqs: Prerequisites | [], descriptions: string | null]
> {
  const detailsHtml = await downloadCourseDetails(term, courseId);
  const prereqs = await parseCoursePrereqs(detailsHtml, courseId);
  const description = parseCourseDescription(detailsHtml, courseId);
  return [detailsHtml.length, prereqs, description];
}

main();
