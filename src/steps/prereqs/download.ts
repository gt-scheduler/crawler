import axios from "axios";
import { concatParams } from "../../utils";

/**
 * Downloads the course prerequisite information for all provided courses in parallel
 * (**note**: returns an array of promises to allow for parallel downstream processing)
 * @param term - The term string
 * @param courseId - An array of joined course ids (SUBJECT NUMBER); i.e. `"CS 2340"`
 */
export function downloadPrereqs(
  term: string,
  courseIds: string[]
): Promise<[courseId: string, html: string]>[] {
  // Note: it is very important that we construct an array of promises here
  // and let downstream components wait on all of them at the end (in parallel)
  // instead of awaiting them one by one (in series)
  return courseIds.map(courseId => downloadCoursePrereqs(term, courseId));
}

/**
 * Downloads the course prerequisite information for a single course
 * @param term - The term string
 * @param courseId - The joined course id (SUBJECT NUMBER); i.e. `"CS 2340"`
 */
export async function downloadCoursePrereqs(
  term: string,
  courseId: string
): Promise<[courseId: string, html: string]> {
  // Attempt to split the course ID into its subject/number
  const splitResult = splitCourseId(courseId);
  if (splitResult === null) {
    console.warn(`Could not split course ID '${courseId}'; skipping prereq scraping for it`);
    return [courseId, ""];
  }

  const [subject, number] = splitResult;
  const parameters = {
    cat_term_in: term,
    subj_code_in: subject,
    crse_numb_in: number,
  };

  // Perform the request
  const query = `?${concatParams(parameters)}`;
  const url = `https://oscar.gatech.edu/pls/bprod/bwckctlg.p_disp_course_detail${query}`;
  const requestResult = await axios.get<string>(url);
  return [courseId, requestResult.data];
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
