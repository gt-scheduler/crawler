import { warn } from "../../log";
import { regexExec } from "../../utils";

const descriptionRegex = /<TD CLASS="ntdefault">([\s\S]*?)<br \/>/;

/**
 * Parses the HTML for a single course to get its description, if it has one
 * @param html - Source HTML from the course details page
 * @param courseId - The joined course id (SUBJECT NUMBER); i.e. `"CS 2340"`
 */
export function parseCourseDescription(
  html: string,
  courseId: string
): string | null {
  try {
    // Get the first match of the description content regex
    const [, contents] = regexExec(descriptionRegex, html);

    // Clean up the contents to remove HTML elements and get plaintext
    const withoutHtml = contents.replace(/<[^>]*>/g, "");
    const trimmed = withoutHtml.trim();

    // Only return the description if it is non-empty
    if (trimmed.length === 0) {
      return null;
    }

    return trimmed;
  } catch {
    warn(`could not execute course description regex`, { courseId });
    return null;
  }
}
