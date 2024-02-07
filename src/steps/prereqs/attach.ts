import { warn } from "../../log";
import { TermData, Prerequisites } from "../../types";
import { splitCourseId } from "../details";

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
  Object.keys(prerequisites).forEach((courseIdTemp) => {
    const splitCourse = splitCourseId(courseIdTemp);
    if (!splitCourse) return;
    const courseId = splitCourse.slice(0, 2).join(" ");
    const crn = splitCourse?.[2];

    if (!crn && courseId in termData.courses) {
      // eslint-disable-next-line no-param-reassign
      termData.courses[courseId][2] = prerequisites[courseId];
    } else if (crn && courseId in termData.courses) {
      // Populates section prerequisites by matching CRNs to find the correct section to attach to
      Object.keys(termData.courses[courseId][1]).forEach((section) => {
        if (termData.courses[courseId][1][section][0] === crn) {
          /* eslint-disable no-param-reassign */
          termData.courses[courseId][1][section][8] =
            prerequisites[courseIdTemp];
        }
      });

      // [...][8] = prerequisites[courseId]
    } else {
      warn(`received prerequisite data for unknown course`, { courseId });
    }
  });
}
