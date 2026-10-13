import axios, { AxiosInstance } from "axios";
import { backOff } from "exponential-backoff";
import asyncPool from "tiny-async-pool";

import { concatParams } from "../utils";
import { BannerResponse, SectionResponse } from "../types";
import { error, span } from "../log";

export const MAX_PAGE_SIZE = 500;
export const MAX_ATTEMPT_COUNT = 10;
export const PAGE_SIZE = 150; // Best runtime vs number of requests ratio

export interface SectionsPage {
  sections: SectionResponse[];
  totalCount: number;
}

/**
 * Creates a Banner 9 API query object based on inputs
 */
export function buildParams({
  term,
  pageOffset,
  pageMaxSize,
}: {
  term: string;
  pageOffset: number;
  pageMaxSize: number;
}): Record<string, string> {
  return {
    txt_term: term,
    txt_subj: "",
    txt_courseNumber: "",
    startDatepicker: "",
    endDatepicker: "",
    pageOffset: pageOffset.toString(),
    pageMaxSize: pageMaxSize.toString(),
    sortColumn: "subjectDescription",
    sortDirection: "asc",
  };
}

/**
 * Generates session cookies for the Banner 9 API for the given term with exponential backoff in case of errors.
 * @param term - The term whose session is created
 * @returns An array of the 2 string cookies the Banner 9 API generates
 */
export async function generateSearchSessionCookies(
  term: string
): Promise<string[]> {
  try {
    // Retries request with exponential back off in case of errors
    const response = await backOff(
      () =>
        axios
          .get(
            "https://registration.banner.gatech.edu/StudentRegistrationSsb",
            {
              headers: {
                "User-Agent": "gt-scheduler/crawler",
              },
            }
          )
          .then(async (res) => {
            // Throws an error if session cookie generated is undefined to trigger a retry
            if (res.headers["set-cookie"] === undefined) {
              throw new Error("Null session cookie generated in /getTerms");
            }

            await axios.post(
              "https://registration.banner.gatech.edu/StudentRegistrationSsb/ssb/term/search?mode=search",
              { term },
              {
                headers: {
                  "Content-Type":
                    "application/x-www-form-urlencoded; charset=UTF-8",
                  "User-Agent": "gt-scheduler/crawler",
                  Cookie: res.headers["set-cookie"],
                },
              }
            );

            return res;
          }),
      {
        // See https://github.com/coveooss/exponential-backoff for options API.
        jitter: "full",
        numOfAttempts: MAX_ATTEMPT_COUNT,
        retry: (err, attemptNumber) => {
          error(
            `an error occurred while generating banner session cookies`,
            err,
            {
              term,
              attemptNumber,
              tryingAgain: attemptNumber < MAX_ATTEMPT_COUNT,
            }
          );
          return true;
        },
      }
    );

    const cookies = response.headers["set-cookie"];
    if (cookies === undefined) {
      throw new Error("Null session cookie generated");
    }
    return cookies;
  } catch (err) {
    error(`exhausted retries for generating banner session cookies`, err, {
      term,
    });
    throw err;
  }
}

/**
 * Fetches a page of sections data for a given term, sectionOffset, and pageMaxSize
 * @param session An axios instance with Banner 9 API session cookies attached
 * @pageOffset The section number starting from which sections need to be fetched
 * @param pageMaxSize The size of page returned (max. 500)
 */
async function getSectionsPage({
  session,
  term,
  pageOffset,
  pageMaxSize,
}: {
  session: AxiosInstance;
  term: string;
  pageOffset: number;
  pageMaxSize: number;
}): Promise<SectionsPage> {
  const params = buildParams({
    term,
    pageOffset,
    pageMaxSize,
  });
  const query = `?${concatParams(params)}`;
  const url = `https://registration.banner.gatech.edu/StudentRegistrationSsb/ssb/searchResults/searchResults${query}`;

  try {
    // Retries request with exponential back off in case of errors
    const response = await backOff(
      () =>
        session
          .get<BannerResponse>(url, {
            headers: {
              "User-Agent": "gt-scheduler/crawler",
            },
          })
          .then((res) => {
            // Throws an error if Banner response data is null to trigger a retry
            if (res.data.data === null) {
              throw new Error("Fetched null data");
            }
            return res;
          }),
      {
        // See https://github.com/coveooss/exponential-backoff for options API
        jitter: "full",
        numOfAttempts: MAX_ATTEMPT_COUNT,
        retry: (err, attemptNumber) => {
          error(`an error occurred while range of section JSON pages`, err, {
            term,
            pageOffset,
            pageMaxSize,
            attemptNumber,
            tryingAgain: attemptNumber < MAX_ATTEMPT_COUNT,
          });
          return true;
        },
      }
    );

    const bannerResponse = response.data;
    if (bannerResponse.data === null) {
      throw new Error("Fetched null data");
    }

    return {
      sections: bannerResponse.data,
      totalCount: bannerResponse.totalCount,
    };
  } catch (err) {
    error(`exhausted retries for range of section JSON pages`, err, {
      term,
      pageOffset,
      pageMaxSize,
    });
    throw err;
  }
}

export async function download(
  term: string,
  numThreads: number
): Promise<SectionResponse[]> {
  let spanFields: Record<string, unknown> = { term };

  // Generates and attaches a session cookie for the given term to an axios instance.
  const cookies = await span(
    "generating banner session cookies",
    { term },
    async () => generateSearchSessionCookies(term)
  );
  const session = axios.create({
    headers: { Cookie: cookies },
  });

  // Gets total section count for the given query by fetching one section.
  // For a pageMaxSize of 0, pageOffset 0 fetches 10 sections while pageOffset 1 fetches 1 section.
  // We only care about the totalCount returned so we minimize the time taken to retrieve it by
  // using pageOffset of 1.
  const firstSection = await span(
    "fetching initial section",
    { ...spanFields, pageOffset: 1, pageMaxSize: 0 },
    async (setCompletionFields) => {
      const sectionsPage = await getSectionsPage({
        session,
        term,
        pageOffset: 1,
        pageMaxSize: 0,
      });
      setCompletionFields({ totalCount: sectionsPage.totalCount });
      return sectionsPage;
    }
  );
  const { totalCount } = firstSection;

  const numRequests = Math.ceil(totalCount / PAGE_SIZE);

  // Creates an array of sectionOffset values based on the number of requests required
  const offsetArr = Array<number>(numRequests)
    .fill(0)
    .map((_, i) => PAGE_SIZE * i);

  // Stores the response data of the concurrent fetches of course data in an array
  let sectionsPages: SectionsPage[] = [];

  const pageMaxSize = PAGE_SIZE;
  spanFields = { ...spanFields, totalCount, pageMaxSize };
  await span(
    "fetching all section JSON pages in thread pool",
    spanFields,
    async (setCompletionFields) => {
      if (numRequests >= 1) {
        // Creates a partially applied function for getSectionsPage that only takes in a
        // pageOffset input with the remaining parameters fixed.
        const partiallyAppliedGetSectionsPage = (pageOffset: number) =>
          span(
            "fetching range of section JSON pages",
            { ...spanFields, pageOffset },
            async (setCompletionFieldsInner) => {
              const sectionsPage = await getSectionsPage({
                session,
                term,
                pageOffset,
                pageMaxSize,
              });
              setCompletionFieldsInner({
                sectionsCount: sectionsPage.sections.length,
              });
              return sectionsPage;
            }
          );
        sectionsPages = await asyncPool(
          numThreads,
          offsetArr,
          partiallyAppliedGetSectionsPage
        );
      }
      const fetchedCount = sectionsPages.reduce(
        (count, sectionsPage) => count + sectionsPage.sections.length,
        0
      );
      setCompletionFields({
        fetchedCount,
      });
    }
  );

  // Concatenates all section pages into one array
  const sections: SectionResponse[] = [];
  sectionsPages.forEach((sectionsPage) =>
    sections.push(...sectionsPage.sections)
  );

  if (sections.length !== totalCount) {
    const err = new Error(
      "Fetched data count does not match total sections count"
    );
    error(`error counting course sections`, err, {
      term,
      fetchedCount: sections.length,
      totalCount,
    });
    throw err;
  }

  return sections;
}
