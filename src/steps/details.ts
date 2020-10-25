import axios from "axios";
import { concatParams } from "../utils";

// The delay between sequential requests, in ms
const DELAY_PER_REQUEST = 100;

/**
 * Downloads the course detail information for all provided courses in parallel
 * (**note**: returns an array of promises to allow for parallel downstream processing)
 * @param term - The term string
 * @param courseId - An array of joined course ids (SUBJECT NUMBER); i.e. `"CS 2340"`
 */
export function downloadDetails(
  term: string,
  courseIds: string[]
): Promise<[courseId: string, html: string]>[] {
  // Note: it is very important that we construct an array of promises here
  // and let downstream components wait on all of them at the end (in parallel)
  // instead of awaiting them one by one (in series).
  // However, because we do this, we need to be careful
  // that we don't get rate limited/run into issues with connection limits.
  // To solve this, we sleep for varying amounts
  return courseIds.map(async (courseId, i) => {
    await new Promise(r => setTimeout(r, i * DELAY_PER_REQUEST));
    return downloadCourseDetails(term, courseId);
  });
}

/**
 * Downloads the course detail information for a single course
 * @param term - The term string
 * @param courseId - The joined course id (SUBJECT NUMBER); i.e. `"CS 2340"`
 */
export async function downloadCourseDetails(
  term: string,
  courseId: string
): Promise<[courseId: string, html: string]> {
  // Attempt to split the course ID into its subject/number
  const splitResult = splitCourseId(courseId);
  if (splitResult === null) {
    console.warn(`Could not split course ID '${courseId}'; skipping detail scraping for it`);
    return [courseId, ""];
  }

  const [subject, number] = splitResult;
  const parameters = {
    cat_term_in: term,
    subj_code_in: subject,
    crse_numb_in: number,
  };

  // Perform the request in a retry loop
  // (sometimes, we get rate limits/transport errors so this tries to mitigates them)
  const query = `?${concatParams(parameters)}`;
  const url = `https://oscar.gatech.edu/pls/bprod/bwckctlg.p_disp_course_detail${query}`;
  const retries = 10;
  let lastError: null | unknown = null;
  for (let i = 0; i < retries; i++) {
    // Use exponential backoff
    // (each promise ends up getting staggered
    //  so we shouldn't need any jitter to avoid a thundering herd)
    const backoff = Math.pow(i, 2) * 4000;
    if (backoff > 0) await new Promise(r => setTimeout(r, backoff));

    try {
      const requestResult = await axios.get<string>(url);
      return [courseId, requestResult.data];
    } catch (error) {
      console.warn(`An error occurred while fetching details for course ${courseId}`);
      if (i !== retries - 1) console.warn("Retrying after a backoff");
      lastError = error;
    }
  }

  // If we exited the loop, then reject the promise by throwing an error
  console.error(`Exhausted retries for fetching details for course ${courseId}`);
  throw lastError;
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
