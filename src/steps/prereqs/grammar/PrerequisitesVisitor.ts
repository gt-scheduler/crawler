// Generated from src/steps/prereqs/grammar/Prerequisites.g4 by ANTLR 4.7.3-SNAPSHOT


import { ParseTreeVisitor } from "antlr4ts/tree/ParseTreeVisitor";

import { ParseContext } from "./PrerequisitesParser";
import { ExpressionContext } from "./PrerequisitesParser";
import { TermContext } from "./PrerequisitesParser";
import { AtomContext } from "./PrerequisitesParser";
import { CourseContext } from "./PrerequisitesParser";
import { SubjectContext } from "./PrerequisitesParser";
import { NumberContext } from "./PrerequisitesParser";
import { GradeContext } from "./PrerequisitesParser";


/**
 * This interface defines a complete generic visitor for a parse tree produced
 * by `PrerequisitesParser`.
 *
 * @param <Result> The return type of the visit operation. Use `void` for
 * operations with no return type.
 */
export interface PrerequisitesVisitor<Result> extends ParseTreeVisitor<Result> {
	/**
	 * Visit a parse tree produced by `PrerequisitesParser.parse`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitParse?: (ctx: ParseContext) => Result;

	/**
	 * Visit a parse tree produced by `PrerequisitesParser.expression`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitExpression?: (ctx: ExpressionContext) => Result;

	/**
	 * Visit a parse tree produced by `PrerequisitesParser.term`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitTerm?: (ctx: TermContext) => Result;

	/**
	 * Visit a parse tree produced by `PrerequisitesParser.atom`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitAtom?: (ctx: AtomContext) => Result;

	/**
	 * Visit a parse tree produced by `PrerequisitesParser.course`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitCourse?: (ctx: CourseContext) => Result;

	/**
	 * Visit a parse tree produced by `PrerequisitesParser.subject`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitSubject?: (ctx: SubjectContext) => Result;

	/**
	 * Visit a parse tree produced by `PrerequisitesParser.number`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitNumber?: (ctx: NumberContext) => Result;

	/**
	 * Visit a parse tree produced by `PrerequisitesParser.grade`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitGrade?: (ctx: GradeContext) => Result;
}

