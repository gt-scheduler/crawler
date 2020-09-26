// TODO type
export type Prerequisites = {};

/**
 * Parses the HTML for each course prereq page in parallel,
 * awaiting on all of them at the end to construct the global course id -> prereq map
 * @param promises - List of promises from downloadPrereqs(...)
 */
export async function parsePrereqs(
  promises: Promise<[courseId: string, html: string]>[]
): Promise<Record<string, Prerequisites>> {
  const allPrereqs: Record<string, Prerequisites> = {};
  const parsePromises = promises.map(async (promise) => {
    const [courseId, html] = await promise;
    allPrereqs[courseId] = parseCoursePrereqs(html);
  });

  await Promise.all(parsePromises);
  return allPrereqs;
}

/**
 * Parses the HTML for a single course to get its prerequisites
 * @param html - Source HTML from the course details page
 */
function parseCoursePrereqs(html: string): Prerequisites {
  // TODO implement
  return {};
}
