import { CharStreams, CommonTokenStream } from "antlr4ts";
import { AbstractParseTreeVisitor } from "antlr4ts/tree/AbstractParseTreeVisitor";
import { PrerequisitesLexer } from "./grammar/PrerequisitesLexer";
import {
  AtomContext,
  CourseContext,
  ExpressionContext,
  PrerequisitesParser,
  TermContext,
} from "./grammar/PrerequisitesParser";
import { PrerequisitesVisitor } from "./grammar/PrerequisitesVisitor";
import { regexExec } from "../../utils";

// Final parsed representation
export type MinimumGrade = "A" | "B" | "C" | "D" | "T";
export type PrerequisiteCourse = { id: string; grade: MinimumGrade };
export type PrerequisiteClause = PrerequisiteCourse | PrerequisiteSet;
export type PrerequisiteOperator = "and" | "or";
export type PrerequisiteSet = [
  operator: PrerequisiteOperator,
  ...clauses: PrerequisiteClause[]
];

/**
 * Recursive data structure that is the sequence of all prerequisites in prefix notation,
 * parsed from the information on Oscar
 * 
 * @example
 * 
 * ```json
   [
     "and",
     [
       "or",
       {"id":"CS 3510", "grade":"C"},
       {"id":"CS 3511", "grade":"C"}
     ]
   ]
 * ```
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
  console.log(JSON.stringify(allPrereqs));
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
  // and pass it into our visitor to transform the parse tree
  // into the prefix-notation parsed version
  const tree = parser.parse();
  const visitor = new PrefixNotationVisitor();
  const prerequisiteClause = visitor.visit(tree);

  // If there is only a single prereq, return as a prefix set with "AND"
  if (isSingleCourse(prerequisiteClause)) {
    return ["and", prerequisiteClause];
  }

  // Finally, flatten the tree so that consecutive operands
  // for the same operator in a series of nested PrerequisiteSets
  // are put into a single PrerequisiteSet
  return flatten(prerequisiteClause);
}

/**
 * Cleans the contents from the HTML into something that can be recognized
 * by the ANTLR-generated parser according to the grammar in `./grammar`
 * @param contents - Original HTML contents from the downloaded details page
 */
function cleanContents(contents: string): string {
  // Replace all occurrences of HTML elements
  // https://stackoverflow.com/a/15180206
  contents = contents.replace(/<[^>]*>/g, "");

  // Remove leading/trailing spaces
  return contents.trim();
}

function isSingleCourse(
  clause: PrerequisiteClause
): clause is PrerequisiteCourse {
  return typeof clause === "object" && !Array.isArray(clause);
}

/**
 * Flattens a prerequisite tree so that:
 * - singular `PrerequisiteSet`s like `['and', 'CS 2340 (C)']`
 *   get turned into their string version (`'CS 2340 (C)'`)
 * - consecutive operands
 *   for the same operator in a series of nested `PrerequisiteSet`s
 *   are put into a single `PrerequisiteSet`
 * @param source - Source prerequisites tree using prefix boolean operators
 */
function flatten(source: PrerequisiteSet): PrerequisiteSet {
  function flattenInner(clause: PrerequisiteClause): PrerequisiteClause {
    // If the clause is a single course, nothing can be done to flatten
    if (isSingleCourse(clause)) return clause;

    const [operator, ...children] = clause;

    // Check for singular `PrerequisiteSet`s
    if (children.length === 1) {
      return flattenInner(children[0]);
    }

    // Check for nested `PrerequisiteSet`s that have the same operator
    const newChildren = [];
    for (const child of children) {
      const flattened = flattenInner(child);

      // If the child is an array and has the same operator,
      // append its children to the current children array
      if (
        typeof flattened === "object" &&
        Array.isArray(flattened) &&
        flattened[0] === operator
      ) {
        newChildren.push(...flattened.slice(1));
      } else {
        // Otherwise, just add the child
        newChildren.push(flattened);
      }
    }

    return [operator, ...children.map(flattenInner)];
  }

  // Call the recursive traversal function on the root node's children
  const [operator, ...children] = source;
  return [operator, ...children.map(flattenInner)];
}

// Defines the class used to flatten the parse tree
// into the prefix-notation parsed version
class PrefixNotationVisitor
  extends AbstractParseTreeVisitor<PrerequisiteClause>
  implements PrerequisitesVisitor<PrerequisiteClause> {
  defaultResult(): PrerequisiteClause {
    return (null as unknown) as PrerequisiteClause;
  }

  // Expression: logical disjunction (OR)
  visitExpression(ctx: ExpressionContext): PrerequisiteClause {
    // Create the `PrerequisiteSet` using each child
    return ["or", ...ctx.term().map((termCtx) => this.visit(termCtx))];
  }

  // Term: logical conjunction (AND)
  visitTerm(ctx: TermContext): PrerequisiteClause {
    // Create the `PrerequisiteSet` using each child
    return ["and", ...ctx.atom().map((atomCtx) => this.visit(atomCtx))];
  }

  visitAtom(ctx: AtomContext): PrerequisiteClause {
    // Visit either the course or the expression inside the parentheses
    const course = ctx.course();
    const expression = ctx.expression();

    if (course != null) {
      return this.visit(course);
    } else if (expression != null) {
      return this.visit(expression);
    }

    throw new Error("Empty Atom received");
  }

  visitCourse(ctx: CourseContext): PrerequisiteClause {
    // Construct the base string for this course
    // using the format expected by the API
    const subject = ctx.subject().COURSE_SUBJECT().toString();
    const number = ctx.number().COURSE_NUMBER().toString();
    const grade = ctx.grade().GRADE_LETTER().toString();
    return { id: `${subject} ${number}`, grade: grade as MinimumGrade };
  }
}
