import { regexExec } from "../../utils";

/**
 * Parses the HTML for each course detail page in parallel,
 * awaiting on all of them at the end to construct the global course id -> description map
 * @param promises - List of promises from downloadDetails(...)
 */
export async function parseDescriptions(
  promises: Promise<[courseId: string, html: string]>[]
): Promise<Record<string, string>> {
  const allDescriptions: Record<string, string> = {};
  const parsePromises = promises.map(async (promise) => {
    const [courseId, html] = await promise;
    const descriptionOption = parseCourseDescription(html, courseId);
    if (descriptionOption != null) {
      allDescriptions[courseId] = descriptionOption;
    }
  });

  await Promise.all(parsePromises);
  return allDescriptions;
}

const descriptionRegex = /<TD CLASS="ntdefault">([\s\S]*?)<br \/>/;

/**
 * Parses the HTML for a single course to get its description, if it has one
 * @param html - Source HTML from the course details page
 * @param courseId - The joined course id (SUBJECT NUMBER); i.e. `"CS 2340"`
 */
function parseCourseDescription(html: string, courseId: string): string | null {
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
    console.warn(
      `Could not execute course description regex for '${courseId}'`
    );
    return null;
  }
}
