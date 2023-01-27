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
const CURRENT_VERSION = 3;

// Number of terms to scrape (scrapes most recent `NUM_TERMS`)
const NUM_TERMS = getIntConfig("NUM_TERMS") ?? 2;

// Whether to always scrape the current term, even if it's not in the
// most recent `NUM_TERMS` terms.
const ALWAYS_SCRAPE_CURRENT_TERM: boolean =
  getIntConfig("ALWAYS_SCRAPE_CURRENT_TERM") === 1;

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
      let toScrape = recentTerms;

      if (ALWAYS_SCRAPE_CURRENT_TERM) {
        // Make sure that, in addition to the most-recent terms,
        // the 'current' term is also scraped. This is done by
        // computing a rough estimate of the current term based on
        // the current date.
        //
        // Motivation: at the beginning of 2023, Oscar had all 3 terms for the
        // year (Spring, Summer, Fall) listed (but no courses were in Summer/
        // Fall). In the past (to my knowledge), this wasn't the case; terms
        // would only appear once the course schedule was released (in the
        // middle of the prior semester). The crawler is configured to scrape
        // the most recent 2 terms, so to make sure it continues to scrape the
        // Spring schedule during the Spring semester, this was added as a
        // workaround.

        type TermLabel = "spring" | "summer" | "fall";
        const getTermEstimate = (date: Date): TermLabel => {
          const month = date.getMonth();
          if (month <= 3 /* Until end of April */) {
            return "spring";
          }
          if (month <= 6 /* Until end of July */) {
            return "summer";
          }
          return "fall";
        };

        /**
         * Reverse of getSemesterName from https://github.com/gt-scheduler/website/blob/main/src/utils/semesters.ts:
         */
        const termLabelToPossibleTermCodes = (
          termString: TermLabel,
          year: number
        ): string[] => {
          switch (termString) {
            case "spring":
              return [`${year}02`, `${year}03`];
            case "summer":
              return [`${year}05`, `${year}06`];
            case "fall":
              return [`${year}08`, `${year}09`];
            default:
              throw new Error(`invalid term string: ${termString}`);
          }
        };

        const now = new Date();
        const currentTermEstimate = getTermEstimate(now);
        const possibleTermCodes = termLabelToPossibleTermCodes(
          currentTermEstimate,
          now.getFullYear()
        );
        const matchingTerms = terms.filter((term) =>
          possibleTermCodes.includes(term)
        );
        if (matchingTerms.length === 0) {
          warn(`no terms match the current term estimate`, {
            currentTermEstimate,
            possibleTermCodesFromEstimate: possibleTermCodes,
            actualTermCodes: terms,
          });
        } else {
          const [matchingTerm] = matchingTerms;
          const alreadyInRecentTerms = recentTerms.includes(matchingTerm);
          if (!alreadyInRecentTerms) {
            toScrape = [matchingTerm, ...recentTerms];
          }
          setFinishFields({
            addedCurrentTerm: !alreadyInRecentTerms,
            currentTerm: matchingTerm,
          });
        }
      }

      setFinishFields({
        terms,
        termsToScrape: toScrape,
        recentTerms,
        desiredNumTerms: NUM_TERMS,
      });
      return toScrape;
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
