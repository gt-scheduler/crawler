import axios from "axios";
import { backOff } from "exponential-backoff";
import { concatParams } from "../utils";
import { warn, error } from "../log";

/**
 * Downloads the course detail information for a single course
 * @param term - The term string
 * @param courseId - The joined course id (SUBJECT NUMBER); i.e. `"CS 2340"`
 */
export async function downloadCourseDetails(
  term: string,
  courseId: string
): Promise<string> {
  // Attempt to split the course ID into its subject/number
  const splitResult = splitCourseId(courseId);
  if (splitResult === null) {
    warn("could not split course ID; skipping detail scraping", {
      courseId,
    });
    return "";
  }

  const [subject, number] = splitResult;
  const parameters = {
    term,
    subjectCode: subject,
    courseNumber: number,
  };

  const query = `?${concatParams(parameters)}`;
  const url = `https://registration.banner.gatech.edu/StudentRegistrationSsb/ssb/courseSearchResults/getCourseDescription${query}`;

  // Perform the request in a retry loop
  // (sometimes, we get rate limits/transport errors so this tries to mitigates them)
  const maxAttemptCount = 10;
  try {
    const response = await backOff(
      () =>
        axios.get<string>(url, {
          headers: {
            "User-Agent": "gt-scheduler/crawler",
          },
        }),
      {
        // See https://github.com/coveooss/exponential-backoff for options API
        jitter: "full",
        numOfAttempts: maxAttemptCount,
        retry: (err, attemptNumber) => {
          error(`an error occurred while fetching details`, err, {
            courseId,
            url,
            attemptNumber,
            tryingAgain: attemptNumber < maxAttemptCount,
          });
          return true;
        },
      }
    );
    return response.data;
  } catch (err) {
    error(`exhausted retries for fetching details`, err, { courseId });
    throw err;
  }
}

/**
 * Downloads the prerequisites for a single course
 * @param term - The term string
 * @param courseId - The joined course id (SUBJECT NUMBER); i.e. `"CS 2340"`
 */
export async function downloadCoursePrereqDetails(
  term: string,
  courseId: string
): Promise<string> {
  const splitResult = splitCourseId(courseId);
  if (splitResult === null) {
    warn("could not split course ID; skipping detail scraping", {
      courseId,
    });
    return "";
  }

  const [subject, number] = splitResult;
  const parameters = {
    term,
    subjectCode: subject,
    courseNumber: number,
  };
  const query = `?${concatParams(parameters)}`;
  const url = `https://registration.banner.gatech.edu/StudentRegistrationSsb/ssb/courseSearchResults/getPrerequisites${query}`;

  // Perform the request in a retry loop
  // (sometimes, we get rate limits/transport errors so this tries to mitigates them)
  const maxAttemptCount = 10;
  try {
    const response = await backOff(
      () =>
        axios.get<string>(url, {
          headers: {
            "User-Agent": "gt-scheduler/crawler",
          },
        }),
      {
        // See https://github.com/coveooss/exponential-backoff for options API
        jitter: "full",
        numOfAttempts: maxAttemptCount,
        retry: (err, attemptNumber) => {
          error(`an error occurred while fetching details`, err, {
            courseId,
            url,
            attemptNumber,
            tryingAgain: attemptNumber < maxAttemptCount,
          });
          return true;
        },
      }
    );
    return response.data;
  } catch (err) {
    error(`exhausted retries for fetching prereqs`, err, { courseId });
    throw err;
  }
}

/**
 * Downloads the corequisites for a single course
 * @param term - The term string
 * @param courseId - The joined course id (SUBJECT NUMBER); i.e. `"CS 2340"`
 */
export async function downloadCourseCoreqDetails(
  term: string,
  courseId: string
): Promise<string> {
  const splitResult = splitCourseId(courseId);
  if (splitResult === null) {
    warn("could not split course ID; skipping detail scraping", {
      courseId,
    });
    return "";
  }

  const [subject, number] = splitResult;
  const parameters = {
    term,
    subjectCode: subject,
    courseNumber: number,
  };
  const query = `?${concatParams(parameters)}`;
  const url = `https://registration.banner.gatech.edu/StudentRegistrationSsb/ssb/courseSearchResults/getCorequisites${query}`;

  // Perform the request in a retry loop
  // (sometimes, we get rate limits/transport errors so this tries to mitigates them)
  const maxAttemptCount = 10;
  try {
    const response = await backOff(
      () =>
        axios.get<string>(url, {
          headers: {
            "User-Agent": "gt-scheduler/crawler",
          },
        }),
      {
        // See https://github.com/coveooss/exponential-backoff for options API
        jitter: "full",
        numOfAttempts: maxAttemptCount,
        retry: (err, attemptNumber) => {
          error(`an error occurred while fetching details`, err, {
            courseId,
            url,
            attemptNumber,
            tryingAgain: attemptNumber < maxAttemptCount,
          });
          return true;
        },
      }
    );
    return response.data;
  } catch (err) {
    error(`exhausted retries for fetching coreqs`, err, { courseId });
    throw err;
  }
}

/**
 * Downloads restriction information for a single section
 * @param term - The term string
 * @param crn - Course Reference Number (section identifier)
 * @returns Tuple of [html content, success status]
 */
export async function downloadSectionRestrictions(
  term: string,
  crn: string
): Promise<[html: string, success: boolean]> {
  const parameters = { term, courseReferenceNumber: crn };
  const query = `?${concatParams(parameters)}`;
  const url = `https://registration.banner.gatech.edu/StudentRegistrationSsb/ssb/searchResults/getRestrictions${query}`;

  const maxAttemptCount = 10;
  try {
    const response = await backOff(
      () =>
        axios.get<string>(url, {
          headers: {
            "User-Agent": "gt-scheduler/crawler",
          },
        }),
      {
        // See https://github.com/coveooss/exponential-backoff for options API
        jitter: "full",
        numOfAttempts: maxAttemptCount,
        retry: (err, attemptNumber) => {
          error(`an error occurred while fetching restrictions`, err, {
            crn,
            url,
            attemptNumber,
            tryingAgain: attemptNumber < maxAttemptCount,
          });
          return true;
        },
      }
    );
    return [response.data, true];
  } catch (err) {
    error(`exhausted retries for fetching restrictions`, err, { crn });
    // Return empty string with failure status instead of throwing
    return ["", false];
  }
}

/**
 * Attempts to split a course ID into its subject/number components
 * @param courseId - The joined course id (SUBJECT NUMBER); i.e. `"CS 2340"`
 */
function splitCourseId(
  courseId: string
): [subject: string, number: string] | null {
  const splitResult = courseId.split(" ");
  if (splitResult.length !== 2) return null;
  return [splitResult[0], splitResult[1]];
}
