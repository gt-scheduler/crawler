import { warn, log } from "../../log";
import { TermData, FetchedRestrictions } from "../../types";

/**
 * Attaches section restrictions to the term data in-place
 * (*mutates the termData parameter*).
 * @param termData - Term data for all courses
 * @param restrictions - Map of CRN -> restriction data with status
 */
export function attachSectionRestrictions(
  termData: TermData,
  restrictions: Record<string, FetchedRestrictions>
): void {
  let successCount = 0;
  let parseErrorCount = 0;
  let fetchErrorCount = 0;
  let notFoundCount = 0;

  Object.entries(restrictions).forEach(([crn, restrictionData]) => {
    let found = false;

    // Search through all courses and sections to find matching CRN
    for (const [courseId, courseData] of Object.entries(termData.courses)) {
      const sectionsMap = courseData[1];

      for (const [sectionId, sectionData] of Object.entries(sectionsMap)) {
        const sectionCrn = sectionData[0];

        if (sectionCrn === crn) {
          found = true;

          // Attach the restriction data (includes status)
          // eslint-disable-next-line no-param-reassign
          sectionData[8] = restrictionData.restrictions;

          // Track counts by status
          if (restrictionData.status === "success") {
            successCount += 1;
          } else if (restrictionData.status === "parse-error") {
            warn(`parse error for section restrictions`, {
              courseId,
              sectionId,
              crn,
            });
            parseErrorCount += 1;
          } else if (restrictionData.status === "fetch-error") {
            warn(`fetch error for section restrictions`, {
              courseId,
              sectionId,
              crn,
            });
            fetchErrorCount += 1;
          }
          break;
        }
      }

      if (found) break;
    }

    if (!found) {
      warn(`received restrictions for unknown CRN`, { crn });
      notFoundCount += 1;
    }
  });

  log(`attached section restrictions`, {
    successCount,
    parseErrorCount,
    fetchErrorCount,
    notFoundCount,
    totalProcessed: Object.keys(restrictions).length,
  });
}
