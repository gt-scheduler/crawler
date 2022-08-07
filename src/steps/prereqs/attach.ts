import { warn } from "../../log";

import type { TermData, Prerequisites } from "../../types";

/**
 * Attaches course prerequisites to the data for the current term in-place
 * (*mutates the termData parameter*).
 * @param termData - Term data for all courses as parsed in previous steps
 * @param prerequisites - Global course Id -> prerequisites map as parsed in previous steps
 */
export function attachPrereqs(
  termData: TermData,
  prerequisites: Record<string, Prerequisites>
): void {
  // For each parsed prerequisite,
  // attach it to the corresponding course
  // (mutate in-place)
  Object.keys(prerequisites).forEach((courseId) => {
    const coursePrereqs = prerequisites[courseId];
    if (coursePrereqs === undefined) {
      throw new Error(
        `invariant violated: description map value not found inside iterator, courseId=${courseId}`
      );
    }

    const course = termData.courses[courseId];
    if (course !== undefined) {
      // eslint-disable-next-line no-param-reassign
      course[2] = coursePrereqs;
    } else {
      warn(`received prerequisite data for unknown course`, { courseId });
    }
  });
}
