import { warn } from "../../log";

import type { TermData } from "../../types";

/**
 * Attaches course descriptions to the data for the current term in-place
 * for all courses with valid descriptions
 * (*mutates the termData parameter*).
 * @param termData - Term data for all courses as parsed in previous steps
 * @param prerequisites - Global course Id -> description as parsed in previous steps
 */
export function attachDescriptions(
  termData: TermData,
  descriptions: Record<string, string | null>
): void {
  Object.keys(descriptions).forEach((courseId) => {
    const courseDescription = descriptions[courseId];
    if (courseDescription === undefined) {
      throw new Error(
        `invariant violated: description map value not found inside iterator, courseId=${courseId}`
      );
    }

    // Skip null descriptions
    if (courseDescription === null) return;

    const course = termData.courses[courseId];
    if (course !== undefined) {
      // eslint-disable-next-line no-param-reassign
      course[3] = courseDescription;
    } else {
      warn(`received description for unknown course`, { courseId });
    }
  });
}
