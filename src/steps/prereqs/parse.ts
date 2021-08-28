/* eslint-disable max-classes-per-file */

import {
  ANTLRErrorListener,
  CharStreams,
  CommonTokenStream,
  Recognizer,
} from "antlr4ts";
import { AbstractParseTreeVisitor } from "antlr4ts/tree/AbstractParseTreeVisitor";
import { ATNSimulator } from "antlr4ts/atn/ATNSimulator";
import { PrerequisitesLexer } from "./grammar/PrerequisitesLexer";
import {
  AtomContext,
  CourseContext,
  ExpressionContext,
  PrerequisitesParser,
  TermContext,
} from "./grammar/PrerequisitesParser";
import { PrerequisitesVisitor } from "./grammar/PrerequisitesVisitor";
import { error } from "../../log";
import {
  MinimumGrade,
  PrerequisiteClause,
  PrerequisiteCourse,
  PrerequisiteOperator,
  Prerequisites,
  PrerequisiteSet,
} from "../../types";
import { regexExec } from "../../utils";

const prereqSectionStart = `<SPAN class="fieldlabeltext">Prerequisites: </SPAN>`;
const prereqSectionRegex = /<br \/>\s*(.*)\s*<br \/>/;

/**
 * Parses the HTML for a single course to get its prerequisites
 * @param html - Source HTML from the course details page
 */
export function parseCoursePrereqs(
  html: string,
  courseId: string
): Prerequisites {
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
  const charStream = CharStreams.fromString(cleaned, courseId);
  const lexer = new PrerequisitesLexer(charStream);
  lexer.removeErrorListeners();
  lexer.addErrorListener(new ErrorListener(courseId, cleaned));
  const tokenStream = new CommonTokenStream(lexer);
  const parser = new PrerequisitesParser(tokenStream);
  parser.removeErrorListeners();
  parser.addErrorListener(new ErrorListener(courseId, cleaned));

  // Get the top-level "parse" rule's tree
  // and pass it into our visitor to transform the parse tree
  // into the prefix-notation parsed version
  const tree = parser.parse();
  const visitor = new PrefixNotationVisitor();
  const prerequisiteClause = visitor.visit(tree);

  // No prerequisites
  if (prerequisiteClause == null) {
    return [];
  }

  // If there is only a single prereq, return as a prefix set with "and"
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
  const replaced = contents.replace(/<[^>]*>/g, "");

  // Remove leading/trailing spaces
  return replaced.trim();
}

/**
 * Type guard to determine if a clause is a single course
 * @param clause - source clause (either single course or prereq set)
 */
function isSingleCourse(
  clause: PrerequisiteClause
): clause is PrerequisiteCourse {
  return typeof clause === "object" && !Array.isArray(clause);
}

/**
 * Type guard to determine if a clause is a null prerequisite set
 * @param clause - source clause (either single course or prereq set)
 */
function isNullSet(
  clause: PrerequisiteClause
): clause is [operator: PrerequisiteOperator] {
  return (
    typeof clause === "object" && Array.isArray(clause) && clause.length === 1
  );
}

/**
 * Flattens a prerequisite tree so that:
 * - singular `PrerequisiteSet`s like `['and', 'CS 2340 (C)']`
 *   get turned into their string version (`'CS 2340 (C)'`)
 * - consecutive operands
 *   for the same operator in a series of nested `PrerequisiteSet`s
 *   are put into a single `PrerequisiteSet`
 * - null set PrerequisiteSet`s like `['and']` get removed
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
      if (!isNullSet(flattened)) {
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
    }

    return [operator, ...children.map(flattenInner)];
  }

  // Call the recursive traversal function on the root node's children
  const [operator, ...children] = source;
  const transformedChildren = children
    .map(flattenInner)
    .filter((c) => !isNullSet(c));
  return [operator, ...transformedChildren];
}

/**
 * Custom error listener class that lets us prepend the course ID
 * onto parsing errors so that they can be easier identified from logs
 */
class ErrorListener implements ANTLRErrorListener<unknown> {
  courseId: string;

  original: string;

  constructor(courseId: string, original: string) {
    this.courseId = courseId;
    this.original = original;
  }

  public syntaxError<T>(
    _recognizer: Recognizer<T, ATNSimulator>,
    _offendingSymbol: T,
    line: number,
    charPositionInLine: number,
    msg: string
  ): void {
    error("an error occurred while parsing prerequisites", new Error(msg), {
      line,
      charPositionInLine,
      courseId: this.courseId,
      originalTextFromOscar: this.original,
    });
  }
}

// Defines the class used to flatten the parse tree
// into the prefix-notation parsed version
class PrefixNotationVisitor
  extends AbstractParseTreeVisitor<PrerequisiteClause>
  implements PrerequisitesVisitor<PrerequisiteClause>
{
  defaultResult(): PrerequisiteClause {
    return null as unknown as PrerequisiteClause;
  }

  // Expression: logical disjunction (OR)
  visitExpression(ctx: ExpressionContext): PrerequisiteClause {
    // Create the `PrerequisiteSet` using each child
    return [
      "or",
      ...ctx
        .term()
        .map((termCtx) => this.visit(termCtx))
        .filter((term) => term != null),
    ];
  }

  // Term: logical conjunction (AND)
  visitTerm(ctx: TermContext): PrerequisiteClause {
    // Create the `PrerequisiteSet` using each child
    return [
      "and",
      ...ctx
        .atom()
        .map((atomCtx) => this.visit(atomCtx))
        .filter((term) => term != null),
    ];
  }

  visitAtom(ctx: AtomContext): PrerequisiteClause {
    // Visit either the course or the expression inside the parentheses
    const course = ctx.course();
    const expression = ctx.expression();
    const test = ctx.test();

    if (course != null) {
      return this.visit(course);
    }
    if (expression != null) {
      return this.visit(expression);
    }
    if (test != null) {
      // Note: we ignore test atoms at the moment,
      // though this can be easily changed in the future
      return this.defaultResult();
    }

    throw new Error("Empty Atom received");
  }

  visitCourse(ctx: CourseContext): PrerequisiteClause {
    // Construct the base string for this course
    // using the format expected by the API
    const subject = ctx.COURSE_SUBJECT().toString();
    const number = ctx.COURSE_NUMBER().toString();

    // There might not be a grade
    let grade: MinimumGrade | undefined;
    const gradeCtx = ctx.GRADE_LETTER();
    if (gradeCtx != null) {
      grade = gradeCtx.toString() as MinimumGrade;
    }

    return { id: `${subject} ${number}`, grade };
  }
}
