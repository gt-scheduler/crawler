import { PrerequisitesLexer } from "./grammar/PrerequisitesLexer";
import { PrerequisitesParser } from "./grammar/PrerequisitesParser";
import { CharStreams, CommonTokenStream } from "antlr4ts";
import { regexExec } from "../../utils";

// Final parsed representation
export type PrerequisiteOperator = "and" | "or";
export type PrerequisiteClause = string | PrerequisiteSet;
export type PrerequisiteSet = [
  operator: PrerequisiteOperator,
  ...clauses: PrerequisiteClause[]
];

/**
 * Recursive data structure that is the sequence of all prerequisites in prefix notation,
 * parsed from the information on Oscar
 */
export type Prerequisites = PrerequisiteSet | [];

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

const prereqSectionStart = `<SPAN class="fieldlabeltext">Prerequisites: </SPAN>`;
const prereqSectionRegex = /<br \/>\s*(.*)\s*<br \/>/;

/**
 * Parses the HTML for a single course to get its prerequisites
 * @param html - Source HTML from the course details page
 */
function parseCoursePrereqs(html: string): Prerequisites {
  const prereqFieldHeaderIndex = html.indexOf(prereqSectionStart);
  if (prereqFieldHeaderIndex === -1) {
    return [];
  }

  // The prerequisites section does exist; find the inner contents:
  const [, contents] = regexExec(
    prereqSectionRegex,
    html.substring(prereqFieldHeaderIndex)
  );

  // Clean up the contents to remove the links and get plaintext
  const cleaned = cleanContents(contents);

  // Create the lexer and parser using the ANTLR 4 grammar defined in ./grammar
  // (using antlr4ts: https://github.com/tunnelvisionlabs/antlr4ts)
  const charStream = CharStreams.fromString(cleaned);
  const lexer = new PrerequisitesLexer(charStream);
  const tokenStream = new CommonTokenStream(lexer);
  const parser = new PrerequisitesParser(tokenStream);

  // Get the top-level "parse" rule's tree
  const tree = parser.parse();
  
  // TODO consume

  return [];
}

function cleanContents(contents: string): string {
  // Replace all occurrences of HTML elements
  // https://stackoverflow.com/a/15180206
  contents = contents.replace(/<[^>]*>/g, "");

  // Remove leading/trailing spaces
  return contents.trim();
}
