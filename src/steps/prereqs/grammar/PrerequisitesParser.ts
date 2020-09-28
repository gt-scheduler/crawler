// Generated from src/steps/prereqs/grammar/Prerequisites.g4 by ANTLR 4.7.3-SNAPSHOT
// @ts-nocheck

import { ATN } from "antlr4ts/atn/ATN";
import { ATNDeserializer } from "antlr4ts/atn/ATNDeserializer";
import { FailedPredicateException } from "antlr4ts/FailedPredicateException";
import { NotNull } from "antlr4ts/Decorators";
import { NoViableAltException } from "antlr4ts/NoViableAltException";
import { Override } from "antlr4ts/Decorators";
import { Parser } from "antlr4ts/Parser";
import { ParserRuleContext } from "antlr4ts/ParserRuleContext";
import { ParserATNSimulator } from "antlr4ts/atn/ParserATNSimulator";
import { ParseTreeListener } from "antlr4ts/tree/ParseTreeListener";
import { ParseTreeVisitor } from "antlr4ts/tree/ParseTreeVisitor";
import { RecognitionException } from "antlr4ts/RecognitionException";
import { RuleContext } from "antlr4ts/RuleContext";
//import { RuleVersion } from "antlr4ts/RuleVersion";
import { TerminalNode } from "antlr4ts/tree/TerminalNode";
import { Token } from "antlr4ts/Token";
import { TokenStream } from "antlr4ts/TokenStream";
import { Vocabulary } from "antlr4ts/Vocabulary";
import { VocabularyImpl } from "antlr4ts/VocabularyImpl";

import * as Utils from "antlr4ts/misc/Utils";

import { PrerequisitesListener } from "./PrerequisitesListener";
import { PrerequisitesVisitor } from "./PrerequisitesVisitor";


export class PrerequisitesParser extends Parser {
	public static readonly AND = 1;
	public static readonly OR = 2;
	public static readonly OPARENS = 3;
	public static readonly CPARENS = 4;
	public static readonly GRADE_LETTER = 5;
	public static readonly COURSE_PREFIX = 6;
	public static readonly GRADE_PREFIX = 7;
	public static readonly TEST_NAME = 8;
	public static readonly COURSE_NUMBER = 9;
	public static readonly COURSE_SUBJECT = 10;
	public static readonly SPACE = 11;
	public static readonly RULE_parse = 0;
	public static readonly RULE_expression = 1;
	public static readonly RULE_term = 2;
	public static readonly RULE_atom = 3;
	public static readonly RULE_course = 4;
	public static readonly RULE_test = 5;
	// tslint:disable:no-trailing-whitespace
	public static readonly ruleNames: string[] = [
		"parse", "expression", "term", "atom", "course", "test",
	];

	private static readonly _LITERAL_NAMES: Array<string | undefined> = [
		undefined, "'and'", "'or'", "'('", "')'", undefined, undefined, "'Minimum Grade of'",
	];
	private static readonly _SYMBOLIC_NAMES: Array<string | undefined> = [
		undefined, "AND", "OR", "OPARENS", "CPARENS", "GRADE_LETTER", "COURSE_PREFIX", 
		"GRADE_PREFIX", "TEST_NAME", "COURSE_NUMBER", "COURSE_SUBJECT", "SPACE",
	];
	public static readonly VOCABULARY: Vocabulary = new VocabularyImpl(PrerequisitesParser._LITERAL_NAMES, PrerequisitesParser._SYMBOLIC_NAMES, []);

	// @Override
	// @NotNull
	public get vocabulary(): Vocabulary {
		return PrerequisitesParser.VOCABULARY;
	}
	// tslint:enable:no-trailing-whitespace

	// @Override
	public get grammarFileName(): string { return "Prerequisites.g4"; }

	// @Override
	public get ruleNames(): string[] { return PrerequisitesParser.ruleNames; }

	// @Override
	public get serializedATN(): string { return PrerequisitesParser._serializedATN; }

	constructor(input: TokenStream) {
		super(input);
		this._interp = new ParserATNSimulator(PrerequisitesParser._ATN, this);
	}
	// @RuleVersion(0)
	public parse(): ParseContext {
		let _localctx: ParseContext = new ParseContext(this._ctx, this.state);
		this.enterRule(_localctx, 0, PrerequisitesParser.RULE_parse);
		try {
			this.state = 15;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 0, this._ctx) ) {
			case 1:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 12;
				this.expression();
				}
				break;

			case 2:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 13;
				this.atom();
				}
				break;

			case 3:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 14;
				this.match(PrerequisitesParser.EOF);
				}
				break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public expression(): ExpressionContext {
		let _localctx: ExpressionContext = new ExpressionContext(this._ctx, this.state);
		this.enterRule(_localctx, 2, PrerequisitesParser.RULE_expression);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 17;
			_localctx._left = this.term();
			this.state = 22;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === PrerequisitesParser.OR) {
				{
				{
				this.state = 18;
				this.match(PrerequisitesParser.OR);
				this.state = 19;
				_localctx._right = this.term();
				}
				}
				this.state = 24;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public term(): TermContext {
		let _localctx: TermContext = new TermContext(this._ctx, this.state);
		this.enterRule(_localctx, 4, PrerequisitesParser.RULE_term);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 25;
			_localctx._left = this.atom();
			this.state = 30;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === PrerequisitesParser.AND) {
				{
				{
				this.state = 26;
				this.match(PrerequisitesParser.AND);
				this.state = 27;
				_localctx._right = this.atom();
				}
				}
				this.state = 32;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public atom(): AtomContext {
		let _localctx: AtomContext = new AtomContext(this._ctx, this.state);
		this.enterRule(_localctx, 6, PrerequisitesParser.RULE_atom);
		try {
			this.state = 39;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case PrerequisitesParser.COURSE_PREFIX:
			case PrerequisitesParser.COURSE_SUBJECT:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 33;
				this.course();
				}
				break;
			case PrerequisitesParser.TEST_NAME:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 34;
				this.test();
				}
				break;
			case PrerequisitesParser.OPARENS:
				this.enterOuterAlt(_localctx, 3);
				{
				{
				this.state = 35;
				this.match(PrerequisitesParser.OPARENS);
				this.state = 36;
				this.expression();
				this.state = 37;
				this.match(PrerequisitesParser.CPARENS);
				}
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public course(): CourseContext {
		let _localctx: CourseContext = new CourseContext(this._ctx, this.state);
		this.enterRule(_localctx, 8, PrerequisitesParser.RULE_course);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 42;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === PrerequisitesParser.COURSE_PREFIX) {
				{
				this.state = 41;
				this.match(PrerequisitesParser.COURSE_PREFIX);
				}
			}

			this.state = 44;
			_localctx._subject = this.match(PrerequisitesParser.COURSE_SUBJECT);
			this.state = 45;
			_localctx._number = this.match(PrerequisitesParser.COURSE_NUMBER);
			this.state = 48;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === PrerequisitesParser.GRADE_PREFIX) {
				{
				this.state = 46;
				this.match(PrerequisitesParser.GRADE_PREFIX);
				this.state = 47;
				_localctx._grade = this.match(PrerequisitesParser.GRADE_LETTER);
				}
			}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public test(): TestContext {
		let _localctx: TestContext = new TestContext(this._ctx, this.state);
		this.enterRule(_localctx, 10, PrerequisitesParser.RULE_test);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 50;
			_localctx._name = this.match(PrerequisitesParser.TEST_NAME);
			this.state = 51;
			_localctx._score = this.match(PrerequisitesParser.COURSE_NUMBER);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}

	public static readonly _serializedATN: string =
		"\x03\uC91D\uCABA\u058D\uAFBA\u4F53\u0607\uEA8B\uC241\x03\r8\x04\x02\t" +
		"\x02\x04\x03\t\x03\x04\x04\t\x04\x04\x05\t\x05\x04\x06\t\x06\x04\x07\t" +
		"\x07\x03\x02\x03\x02\x03\x02\x05\x02\x12\n\x02\x03\x03\x03\x03\x03\x03" +
		"\x07\x03\x17\n\x03\f\x03\x0E\x03\x1A\v\x03\x03\x04\x03\x04\x03\x04\x07" +
		"\x04\x1F\n\x04\f\x04\x0E\x04\"\v\x04\x03\x05\x03\x05\x03\x05\x03\x05\x03" +
		"\x05\x03\x05\x05\x05*\n\x05\x03\x06\x05\x06-\n\x06\x03\x06\x03\x06\x03" +
		"\x06\x03\x06\x05\x063\n\x06\x03\x07\x03\x07\x03\x07\x03\x07\x02\x02\x02" +
		"\b\x02\x02\x04\x02\x06\x02\b\x02\n\x02\f\x02\x02\x02\x029\x02\x11\x03" +
		"\x02\x02\x02\x04\x13\x03\x02\x02\x02\x06\x1B\x03\x02\x02\x02\b)\x03\x02" +
		"\x02\x02\n,\x03\x02\x02\x02\f4\x03\x02\x02\x02\x0E\x12\x05\x04\x03\x02" +
		"\x0F\x12\x05\b\x05\x02\x10\x12\x07\x02\x02\x03\x11\x0E\x03\x02\x02\x02" +
		"\x11\x0F\x03\x02\x02\x02\x11\x10\x03\x02\x02\x02\x12\x03\x03\x02\x02\x02" +
		"\x13\x18\x05\x06\x04\x02\x14\x15\x07\x04\x02\x02\x15\x17\x05\x06\x04\x02" +
		"\x16\x14\x03\x02\x02\x02\x17\x1A\x03\x02\x02\x02\x18\x16\x03\x02\x02\x02" +
		"\x18\x19\x03\x02\x02\x02\x19\x05\x03\x02\x02\x02\x1A\x18\x03\x02\x02\x02" +
		"\x1B \x05\b\x05\x02\x1C\x1D\x07\x03\x02\x02\x1D\x1F\x05\b\x05\x02\x1E" +
		"\x1C\x03\x02\x02\x02\x1F\"\x03\x02\x02\x02 \x1E\x03\x02\x02\x02 !\x03" +
		"\x02\x02\x02!\x07\x03\x02\x02\x02\" \x03\x02\x02\x02#*\x05\n\x06\x02$" +
		"*\x05\f\x07\x02%&\x07\x05\x02\x02&\'\x05\x04\x03\x02\'(\x07\x06\x02\x02" +
		"(*\x03\x02\x02\x02)#\x03\x02\x02\x02)$\x03\x02\x02\x02)%\x03\x02\x02\x02" +
		"*\t\x03\x02\x02\x02+-\x07\b\x02\x02,+\x03\x02\x02\x02,-\x03\x02\x02\x02" +
		"-.\x03\x02\x02\x02./\x07\f\x02\x02/2\x07\v\x02\x0201\x07\t\x02\x0213\x07" +
		"\x07\x02\x0220\x03\x02\x02\x0223\x03\x02\x02\x023\v\x03\x02\x02\x0245" +
		"\x07\n\x02\x0256\x07\v\x02\x026\r\x03\x02\x02\x02\b\x11\x18 ),2";
	public static __ATN: ATN;
	public static get _ATN(): ATN {
		if (!PrerequisitesParser.__ATN) {
			PrerequisitesParser.__ATN = new ATNDeserializer().deserialize(Utils.toCharArray(PrerequisitesParser._serializedATN));
		}

		return PrerequisitesParser.__ATN;
	}

}

export class ParseContext extends ParserRuleContext {
	public expression(): ExpressionContext | undefined {
		return this.tryGetRuleContext(0, ExpressionContext);
	}
	public atom(): AtomContext | undefined {
		return this.tryGetRuleContext(0, AtomContext);
	}
	public EOF(): TerminalNode | undefined { return this.tryGetToken(PrerequisitesParser.EOF, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return PrerequisitesParser.RULE_parse; }
	// @Override
	public enterRule(listener: PrerequisitesListener): void {
		if (listener.enterParse) {
			listener.enterParse(this);
		}
	}
	// @Override
	public exitRule(listener: PrerequisitesListener): void {
		if (listener.exitParse) {
			listener.exitParse(this);
		}
	}
	// @Override
	public accept<Result>(visitor: PrerequisitesVisitor<Result>): Result {
		if (visitor.visitParse) {
			return visitor.visitParse(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class ExpressionContext extends ParserRuleContext {
	public _left: TermContext;
	public _right: TermContext;
	public term(): TermContext[];
	public term(i: number): TermContext;
	public term(i?: number): TermContext | TermContext[] {
		if (i === undefined) {
			return this.getRuleContexts(TermContext);
		} else {
			return this.getRuleContext(i, TermContext);
		}
	}
	public OR(): TerminalNode[];
	public OR(i: number): TerminalNode;
	public OR(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(PrerequisitesParser.OR);
		} else {
			return this.getToken(PrerequisitesParser.OR, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return PrerequisitesParser.RULE_expression; }
	// @Override
	public enterRule(listener: PrerequisitesListener): void {
		if (listener.enterExpression) {
			listener.enterExpression(this);
		}
	}
	// @Override
	public exitRule(listener: PrerequisitesListener): void {
		if (listener.exitExpression) {
			listener.exitExpression(this);
		}
	}
	// @Override
	public accept<Result>(visitor: PrerequisitesVisitor<Result>): Result {
		if (visitor.visitExpression) {
			return visitor.visitExpression(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class TermContext extends ParserRuleContext {
	public _left: AtomContext;
	public _right: AtomContext;
	public atom(): AtomContext[];
	public atom(i: number): AtomContext;
	public atom(i?: number): AtomContext | AtomContext[] {
		if (i === undefined) {
			return this.getRuleContexts(AtomContext);
		} else {
			return this.getRuleContext(i, AtomContext);
		}
	}
	public AND(): TerminalNode[];
	public AND(i: number): TerminalNode;
	public AND(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(PrerequisitesParser.AND);
		} else {
			return this.getToken(PrerequisitesParser.AND, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return PrerequisitesParser.RULE_term; }
	// @Override
	public enterRule(listener: PrerequisitesListener): void {
		if (listener.enterTerm) {
			listener.enterTerm(this);
		}
	}
	// @Override
	public exitRule(listener: PrerequisitesListener): void {
		if (listener.exitTerm) {
			listener.exitTerm(this);
		}
	}
	// @Override
	public accept<Result>(visitor: PrerequisitesVisitor<Result>): Result {
		if (visitor.visitTerm) {
			return visitor.visitTerm(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class AtomContext extends ParserRuleContext {
	public course(): CourseContext | undefined {
		return this.tryGetRuleContext(0, CourseContext);
	}
	public test(): TestContext | undefined {
		return this.tryGetRuleContext(0, TestContext);
	}
	public OPARENS(): TerminalNode | undefined { return this.tryGetToken(PrerequisitesParser.OPARENS, 0); }
	public expression(): ExpressionContext | undefined {
		return this.tryGetRuleContext(0, ExpressionContext);
	}
	public CPARENS(): TerminalNode | undefined { return this.tryGetToken(PrerequisitesParser.CPARENS, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return PrerequisitesParser.RULE_atom; }
	// @Override
	public enterRule(listener: PrerequisitesListener): void {
		if (listener.enterAtom) {
			listener.enterAtom(this);
		}
	}
	// @Override
	public exitRule(listener: PrerequisitesListener): void {
		if (listener.exitAtom) {
			listener.exitAtom(this);
		}
	}
	// @Override
	public accept<Result>(visitor: PrerequisitesVisitor<Result>): Result {
		if (visitor.visitAtom) {
			return visitor.visitAtom(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class CourseContext extends ParserRuleContext {
	public _subject: Token;
	public _number: Token;
	public _grade: Token;
	public COURSE_SUBJECT(): TerminalNode { return this.getToken(PrerequisitesParser.COURSE_SUBJECT, 0); }
	public COURSE_NUMBER(): TerminalNode { return this.getToken(PrerequisitesParser.COURSE_NUMBER, 0); }
	public COURSE_PREFIX(): TerminalNode | undefined { return this.tryGetToken(PrerequisitesParser.COURSE_PREFIX, 0); }
	public GRADE_PREFIX(): TerminalNode | undefined { return this.tryGetToken(PrerequisitesParser.GRADE_PREFIX, 0); }
	public GRADE_LETTER(): TerminalNode | undefined { return this.tryGetToken(PrerequisitesParser.GRADE_LETTER, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return PrerequisitesParser.RULE_course; }
	// @Override
	public enterRule(listener: PrerequisitesListener): void {
		if (listener.enterCourse) {
			listener.enterCourse(this);
		}
	}
	// @Override
	public exitRule(listener: PrerequisitesListener): void {
		if (listener.exitCourse) {
			listener.exitCourse(this);
		}
	}
	// @Override
	public accept<Result>(visitor: PrerequisitesVisitor<Result>): Result {
		if (visitor.visitCourse) {
			return visitor.visitCourse(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class TestContext extends ParserRuleContext {
	public _name: Token;
	public _score: Token;
	public TEST_NAME(): TerminalNode { return this.getToken(PrerequisitesParser.TEST_NAME, 0); }
	public COURSE_NUMBER(): TerminalNode { return this.getToken(PrerequisitesParser.COURSE_NUMBER, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return PrerequisitesParser.RULE_test; }
	// @Override
	public enterRule(listener: PrerequisitesListener): void {
		if (listener.enterTest) {
			listener.enterTest(this);
		}
	}
	// @Override
	public exitRule(listener: PrerequisitesListener): void {
		if (listener.exitTest) {
			listener.exitTest(this);
		}
	}
	// @Override
	public accept<Result>(visitor: PrerequisitesVisitor<Result>): Result {
		if (visitor.visitTest) {
			return visitor.visitTest(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


