import { warn } from "../../log";
import { TermData, Corequisites } from "../../types";

/**
 * Attaches course corequisites to the data for the current term in-place
 * (*mutates the termData parameter*).
 * @param termData - Term data for all courses as parsed in previous steps
 * @param corequisites - Global course Id -> corequisites map as parsed in previous steps
 */
export function attachCoreqs(
  termData: TermData,
  corequisites: Record<string, Corequisites>
): void {
  // For each parsed corequisite,
  // attach it to the corresponding course
  // (mutate in-place)
  Object.keys(corequisites).forEach((courseId) => {
    if (courseId in termData.courses) {
      // eslint-disable-next-line no-param-reassign
      termData.courses[courseId][4] = corequisites[courseId];
    } else {
      warn(`received corequisite data for unknown course`, { courseId });
    }
  });
}
