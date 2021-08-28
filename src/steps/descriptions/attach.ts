import { warn } from "../../log";
import { TermData } from "../../types";

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
    // Skip null descriptions
    if (descriptions[courseId] === null) return;

    if (courseId in termData.courses) {
      // eslint-disable-next-line no-param-reassign
      termData.courses[courseId][3] = descriptions[courseId];
    } else {
      warn(`received description for unknown course`, { courseId });
    }
  });
}
