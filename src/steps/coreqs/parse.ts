import { load } from "cheerio";

import { courseMap } from "../../constants";
import { Corequisites } from "../../types";
import { warn } from "../../log";

// Header's indices in corereq HTML table
const Headers = {
  Subject: 0,
  CourseNumber: 1,
  Title: 2,
};

/**
 * Parses the HTML of a single course to get its corequisites
 * @param html - Source HTML for the page
 * @param courseId - The joined course id (SUBJECT NUMBER); i.e. `"CS 2340"`
 */
export function parseCourseCoreqs(
  html: string,
  courseId: string
): Corequisites {
  const $ = load(html);
  const coreqTable = $("section[aria-labelledby='coReqs']").find("tr");
  const coreqs: Corequisites = [];

  coreqTable.each((rowIndex, element) => {
    if (rowIndex === 0) return;

    const coreqRow = $(element).children();
    let subjectCode: string | undefined;
    let courseNumber: string | undefined;
    coreqRow.each((colIndex: number): void => {
      if (colIndex === Headers.Title) return;

      let value = coreqRow.eq(colIndex).text().trim();
      if (value.length === 0) return;
      if (colIndex === Headers.Subject) {
        subjectCode = courseMap.get(value);
        if (!subjectCode) {
          warn(
            `Course has a coreq for ${value} whose abbreviation does not exist. Coreq skipped.`,
            {
              courseId,
              subject: value,
            }
          );
          return;
        }
        value = subjectCode;
      }
      if (colIndex === Headers.CourseNumber) {
        courseNumber = value;
      }
    });

    if (subjectCode && courseNumber) {
      coreqs.push({ id: `${subjectCode} ${courseNumber}` });
    }
  });
  return coreqs;
}
