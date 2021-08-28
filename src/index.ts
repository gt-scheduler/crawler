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
} from "./steps";
import { Prerequisites } from "./types";
import {
  setLogFormat,
  isLogFormat,
  log,
  error,
  span,
  warn,
  getLogFormat,
} from "./log";
import { getIntConfig } from "./utils";

// Current scraped JSON version
const CURRENT_VERSION = 2;

// Number of terms to scrape (scrapes most recent `NUM_TERMS`)
const NUM_TERMS = getIntConfig("NUM_TERMS") ?? 2;

// IO Concurrency to download files using.
// This is a completely arbitrary number.
const DETAILS_CONCURRENCY = getIntConfig("DETAILS_CONCURRENCY") ?? 128;

async function main(): Promise<void> {
  const rawLogFormat = process.env.LOG_FORMAT;
  if (rawLogFormat != null) {
    if (isLogFormat(rawLogFormat)) {
      setLogFormat(rawLogFormat);
    } else {
      warn(`invalid log format provided`, { logFormat: rawLogFormat });
      process.exit(1);
    }
  } else {
    setLogFormat("text");
  }

  log(`starting crawler`, {
    currentVersion: CURRENT_VERSION,
    numTerms: NUM_TERMS,
    detailsConcurrency: DETAILS_CONCURRENCY,
    logFormat: getLogFormat(),
  });

  try {
    // Create a new top-level span for the entire crawler operation.
    // This simply logs when before/after the operation
    // so we know how long it took.
    await span(`crawling Oscar`, {}, async () => crawl());
    process.exit(0);
  } catch (err) {
    error(`a fatal error occurred while running the crawler`, err);
    process.exit(1);
  }
}

async function crawl(): Promise<void> {
  const termsToScrape = await span(
    `listing all terms`,
    {},
    async (setFinishFields) => {
      const terms = await list();
      const recentTerms = terms.slice(0, NUM_TERMS);
      setFinishFields({ terms, recentTerms, desiredNumTerms: NUM_TERMS });
      return recentTerms;
    }
  );

  // Scrape each term in parallel
  await Promise.all(
    termsToScrape.map(async (term) => {
      // Set the base fields that are added to every span
      const termSpanFields: Record<string, unknown> = {
        term,
        version: CURRENT_VERSION,
      };

      await span(`crawling term`, termSpanFields, () =>
        crawlTerm(term, termSpanFields)
      );
    })
  );
}

async function crawlTerm(
  term: string,
  baseSpanFields: Record<string, unknown>
): Promise<void> {
  // Alias the parameter so we can modify it
  let spanFields = baseSpanFields;

  // Download the term HTML page containing every course.
  const html = await span(`downloading term`, spanFields, () => download(term));

  const termData = await span(`parsing term data to JSON`, spanFields, () =>
    parse(html, CURRENT_VERSION)
  );

  const allCourseIds = Object.keys(termData.courses);
  const courseIdCount = allCourseIds.length;
  spanFields = { ...spanFields, courseIdCount };
  log(`collected all course ids`, { allCourseIds, ...spanFields });

  const allPrereqs: Record<string, Prerequisites | []> = {};
  const allDescriptions: Record<string, string | null> = {};
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
