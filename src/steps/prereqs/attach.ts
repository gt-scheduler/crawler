import { warn } from "../../log";
import { TermData, Prerequisites } from "../../types";

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
    if (courseId in termData.courses) {
      // eslint-disable-next-line no-param-reassign
      termData.courses[courseId][2] = prerequisites[courseId];
    } else {
      warn(`received prerequisite data for unknown course`, { courseId });
    }
  });
}
