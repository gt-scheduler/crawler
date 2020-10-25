import { TermData } from "../../types";

/**
 * Attaches course descriptions to the data for the current term in-place
 * for all courses with valid descriptions
 * (*mutates the termData parameter*).
 * @param termData - Term data for all courses as parsed in previous steps
 * @param prerequisites - Global course Id -> description as parsed in previous steps
 */
export function attachDescriptions(termData: TermData, descriptions: Record<string, string>): void {
    Object.keys(descriptions).forEach(courseId => {
        if (courseId in termData.courses) {
            termData.courses[courseId][3] = descriptions[courseId];
        } else {
            console.warn(`Received description for unknown course '${courseId}'`);
        }
    });
}
