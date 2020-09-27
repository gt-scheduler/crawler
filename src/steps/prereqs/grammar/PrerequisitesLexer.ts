// Generated from src/steps/prereqs/grammar/Prerequisites.g4 by ANTLR 4.7.3-SNAPSHOT
// @ts-nocheck

import { ATN } from "antlr4ts/atn/ATN";
import { ATNDeserializer } from "antlr4ts/atn/ATNDeserializer";
import { CharStream } from "antlr4ts/CharStream";
import { Lexer } from "antlr4ts/Lexer";
import { LexerATNSimulator } from "antlr4ts/atn/LexerATNSimulator";
import { NotNull } from "antlr4ts/Decorators";
import { Override } from "antlr4ts/Decorators";
import { RuleContext } from "antlr4ts/RuleContext";
import { Vocabulary } from "antlr4ts/Vocabulary";
import { VocabularyImpl } from "antlr4ts/VocabularyImpl";

import * as Utils from "antlr4ts/misc/Utils";


export class PrerequisitesLexer extends Lexer {
	public static readonly AND = 1;
	public static readonly OR = 2;
	public static readonly OPARENS = 3;
	public static readonly CPARENS = 4;
	public static readonly GRADE_LETTER = 5;
	public static readonly COURSE_NUMBER = 6;
	public static readonly COURSE_SUBJECT = 7;
	public static readonly COURSE_PREFIX = 8;
	public static readonly GRADE_PREFIX = 9;
	public static readonly SPACE = 10;

	// tslint:disable:no-trailing-whitespace
	public static readonly channelNames: string[] = [
		"DEFAULT_TOKEN_CHANNEL", "HIDDEN",
	];

	// tslint:disable:no-trailing-whitespace
	public static readonly modeNames: string[] = [
		"DEFAULT_MODE",
	];

	public static readonly ruleNames: string[] = [
		"AND", "OR", "OPARENS", "CPARENS", "GRADE_LETTER", "COURSE_NUMBER", "COURSE_SUBJECT", 
		"COURSE_PREFIX", "GRADE_PREFIX", "SPACE",
	];

	private static readonly _LITERAL_NAMES: Array<string | undefined> = [
		undefined, "'and'", "'or'", "'('", "')'", undefined, undefined, undefined, 
		"'Undergraduate Semester level'", "'Minimum Grade of'",
	];
	private static readonly _SYMBOLIC_NAMES: Array<string | undefined> = [
		undefined, "AND", "OR", "OPARENS", "CPARENS", "GRADE_LETTER", "COURSE_NUMBER", 
		"COURSE_SUBJECT", "COURSE_PREFIX", "GRADE_PREFIX", "SPACE",
	];
	public static readonly VOCABULARY: Vocabulary = new VocabularyImpl(PrerequisitesLexer._LITERAL_NAMES, PrerequisitesLexer._SYMBOLIC_NAMES, []);

	// @Override
	// @NotNull
	public get vocabulary(): Vocabulary {
		return PrerequisitesLexer.VOCABULARY;
	}
	// tslint:enable:no-trailing-whitespace


	constructor(input: CharStream) {
		super(input);
		this._interp = new LexerATNSimulator(PrerequisitesLexer._ATN, this);
	}

	// @Override
	public get grammarFileName(): string { return "Prerequisites.g4"; }

	// @Override
	public get ruleNames(): string[] { return PrerequisitesLexer.ruleNames; }

	// @Override
	public get serializedATN(): string { return PrerequisitesLexer._serializedATN; }

	// @Override
	public get channelNames(): string[] { return PrerequisitesLexer.channelNames; }

	// @Override
	public get modeNames(): string[] { return PrerequisitesLexer.modeNames; }

	public static readonly _serializedATN: string =
		"\x03\uC91D\uCABA\u058D\uAFBA\u4F53\u0607\uEA8B\uC241\x02\f`\b\x01\x04" +
		"\x02\t\x02\x04\x03\t\x03\x04\x04\t\x04\x04\x05\t\x05\x04\x06\t\x06\x04" +
		"\x07\t\x07\x04\b\t\b\x04\t\t\t\x04\n\t\n\x04\v\t\v\x03\x02\x03\x02\x03" +
		"\x02\x03\x02\x03\x03\x03\x03\x03\x03\x03\x04\x03\x04\x03\x05\x03\x05\x03" +
		"\x06\x03\x06\x03\x07\x06\x07&\n\x07\r\x07\x0E\x07\'\x03\b\x06\b+\n\b\r" +
		"\b\x0E\b,\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t" +
		"\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03" +
		"\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\n\x03\n\x03\n\x03\n\x03" +
		"\n\x03\n\x03\n\x03\n\x03\n\x03\n\x03\n\x03\n\x03\n\x03\n\x03\n\x03\n\x03" +
		"\n\x03\v\x03\v\x03\v\x03\v\x02\x02\x02\f\x03\x02\x03\x05\x02\x04\x07\x02" +
		"\x05\t\x02\x06\v\x02\x07\r\x02\b\x0F\x02\t\x11\x02\n\x13\x02\v\x15\x02" +
		"\f\x03\x02\x06\x04\x02CFVV\x04\x022;ZZ\x03\x02C\\\x05\x02\v\f\x0F\x0F" +
		"\"\"\x02a\x02\x03\x03\x02\x02\x02\x02\x05\x03\x02\x02\x02\x02\x07\x03" +
		"\x02\x02\x02\x02\t\x03\x02\x02\x02\x02\v\x03\x02\x02\x02\x02\r\x03\x02" +
		"\x02\x02\x02\x0F\x03\x02\x02\x02\x02\x11\x03\x02\x02\x02\x02\x13\x03\x02" +
		"\x02\x02\x02\x15\x03\x02\x02\x02\x03\x17\x03\x02\x02\x02\x05\x1B\x03\x02" +
		"\x02\x02\x07\x1E\x03\x02\x02\x02\t \x03\x02\x02\x02\v\"\x03\x02\x02\x02" +
		"\r%\x03\x02\x02\x02\x0F*\x03\x02\x02\x02\x11.\x03\x02\x02\x02\x13K\x03" +
		"\x02\x02\x02\x15\\\x03\x02\x02\x02\x17\x18\x07c\x02\x02\x18\x19\x07p\x02" +
		"\x02\x19\x1A\x07f\x02\x02\x1A\x04\x03\x02\x02\x02\x1B\x1C\x07q\x02\x02" +
		"\x1C\x1D\x07t\x02\x02\x1D\x06\x03\x02\x02\x02\x1E\x1F\x07*\x02\x02\x1F" +
		"\b\x03\x02\x02\x02 !\x07+\x02\x02!\n\x03\x02\x02\x02\"#\t\x02\x02\x02" +
		"#\f\x03\x02\x02\x02$&\t\x03\x02\x02%$\x03\x02\x02\x02&\'\x03\x02\x02\x02" +
		"\'%\x03\x02\x02\x02\'(\x03\x02\x02\x02(\x0E\x03\x02\x02\x02)+\t\x04\x02" +
		"\x02*)\x03\x02\x02\x02+,\x03\x02\x02\x02,*\x03\x02\x02\x02,-\x03\x02\x02" +
		"\x02-\x10\x03\x02\x02\x02./\x07W\x02\x02/0\x07p\x02\x0201\x07f\x02\x02" +
		"12\x07g\x02\x0223\x07t\x02\x0234\x07i\x02\x0245\x07t\x02\x0256\x07c\x02" +
		"\x0267\x07f\x02\x0278\x07w\x02\x0289\x07c\x02\x029:\x07v\x02\x02:;\x07" +
		"g\x02\x02;<\x07\"\x02\x02<=\x07U\x02\x02=>\x07g\x02\x02>?\x07o\x02\x02" +
		"?@\x07g\x02\x02@A\x07u\x02\x02AB\x07v\x02\x02BC\x07g\x02\x02CD\x07t\x02" +
		"\x02DE\x07\"\x02\x02EF\x07n\x02\x02FG\x07g\x02\x02GH\x07x\x02\x02HI\x07" +
		"g\x02\x02IJ\x07n\x02\x02J\x12\x03\x02\x02\x02KL\x07O\x02\x02LM\x07k\x02" +
		"\x02MN\x07p\x02\x02NO\x07k\x02\x02OP\x07o\x02\x02PQ\x07w\x02\x02QR\x07" +
		"o\x02\x02RS\x07\"\x02\x02ST\x07I\x02\x02TU\x07t\x02\x02UV\x07c\x02\x02" +
		"VW\x07f\x02\x02WX\x07g\x02\x02XY\x07\"\x02\x02YZ\x07q\x02\x02Z[\x07h\x02" +
		"\x02[\x14\x03\x02\x02\x02\\]\t\x05\x02\x02]^\x03\x02\x02\x02^_\b\v\x02" +
		"\x02_\x16\x03\x02\x02\x02\x05\x02\',\x03\b\x02\x02";
	public static __ATN: ATN;
	public static get _ATN(): ATN {
		if (!PrerequisitesLexer.__ATN) {
			PrerequisitesLexer.__ATN = new ATNDeserializer().deserialize(Utils.toCharArray(PrerequisitesLexer._serializedATN));
		}

		return PrerequisitesLexer.__ATN;
	}

}

