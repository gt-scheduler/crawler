// Generated from src/steps/prereqs/grammar/Prerequisites.g4 by ANTLR 4.9.0-SNAPSHOT


import { ParseTreeVisitor } from "antlr4ts/tree/ParseTreeVisitor";

import { ParseContext } from "./PrerequisitesParser";
import { EmptyContext } from "./PrerequisitesParser";
import { ExpressionContext } from "./PrerequisitesParser";
import { TermContext } from "./PrerequisitesParser";
import { AtomContext } from "./PrerequisitesParser";
import { CourseContext } from "./PrerequisitesParser";
import { TestContext } from "./PrerequisitesParser";
import { OperatorContext } from "./PrerequisitesParser";


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
	 * Visit a parse tree produced by `PrerequisitesParser.empty`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitEmpty?: (ctx: EmptyContext) => Result;

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
	 * Visit a parse tree produced by `PrerequisitesParser.test`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitTest?: (ctx: TestContext) => Result;

	/**
	 * Visit a parse tree produced by `PrerequisitesParser.operator`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitOperator?: (ctx: OperatorContext) => Result;
}

