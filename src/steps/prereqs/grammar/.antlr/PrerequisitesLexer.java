// Generated from /home/jazev/dev/gt-schedule-crawler/src/steps/prereqs/grammar/Prerequisites.g4 by ANTLR 4.8
import org.antlr.v4.runtime.Lexer;
import org.antlr.v4.runtime.CharStream;
import org.antlr.v4.runtime.Token;
import org.antlr.v4.runtime.TokenStream;
import org.antlr.v4.runtime.*;
import org.antlr.v4.runtime.atn.*;
import org.antlr.v4.runtime.dfa.DFA;
import org.antlr.v4.runtime.misc.*;

@SuppressWarnings({"all", "warnings", "unchecked", "unused", "cast"})
public class PrerequisitesLexer extends Lexer {
	static { RuntimeMetaData.checkVersion("4.8", RuntimeMetaData.VERSION); }

	protected static final DFA[] _decisionToDFA;
	protected static final PredictionContextCache _sharedContextCache =
		new PredictionContextCache();
	public static final int
		AND=1, OR=2, OPARENS=3, CPARENS=4, GRADE_LETTER=5, COURSE_NUMBER=6, COURSE_SUBJECT=7, 
		COURSE_PREFIX=8, GRADE_PREFIX=9, SPACE=10;
	public static String[] channelNames = {
		"DEFAULT_TOKEN_CHANNEL", "HIDDEN"
	};

	public static String[] modeNames = {
		"DEFAULT_MODE"
	};

	private static String[] makeRuleNames() {
		return new String[] {
			"AND", "OR", "OPARENS", "CPARENS", "GRADE_LETTER", "COURSE_NUMBER", "COURSE_SUBJECT", 
			"COURSE_PREFIX", "GRADE_PREFIX", "SPACE"
		};
	}
	public static final String[] ruleNames = makeRuleNames();

	private static String[] makeLiteralNames() {
		return new String[] {
			null, "'and'", "'or'", "'('", "')'", null, null, null, "'Undergraduate Semester level'", 
			"'Minimum Grade of'"
		};
	}
	private static final String[] _LITERAL_NAMES = makeLiteralNames();
	private static String[] makeSymbolicNames() {
		return new String[] {
			null, "AND", "OR", "OPARENS", "CPARENS", "GRADE_LETTER", "COURSE_NUMBER", 
			"COURSE_SUBJECT", "COURSE_PREFIX", "GRADE_PREFIX", "SPACE"
		};
	}
	private static final String[] _SYMBOLIC_NAMES = makeSymbolicNames();
	public static final Vocabulary VOCABULARY = new VocabularyImpl(_LITERAL_NAMES, _SYMBOLIC_NAMES);

	/**
	 * @deprecated Use {@link #VOCABULARY} instead.
	 */
	@Deprecated
	public static final String[] tokenNames;
	static {
		tokenNames = new String[_SYMBOLIC_NAMES.length];
		for (int i = 0; i < tokenNames.length; i++) {
			tokenNames[i] = VOCABULARY.getLiteralName(i);
			if (tokenNames[i] == null) {
				tokenNames[i] = VOCABULARY.getSymbolicName(i);
			}

			if (tokenNames[i] == null) {
				tokenNames[i] = "<INVALID>";
			}
		}
	}

	@Override
	@Deprecated
	public String[] getTokenNames() {
		return tokenNames;
	}

	@Override

	public Vocabulary getVocabulary() {
		return VOCABULARY;
	}


	public PrerequisitesLexer(CharStream input) {
		super(input);
		_interp = new LexerATNSimulator(this,_ATN,_decisionToDFA,_sharedContextCache);
	}

	@Override
	public String getGrammarFileName() { return "Prerequisites.g4"; }

	@Override
	public String[] getRuleNames() { return ruleNames; }

	@Override
	public String getSerializedATN() { return _serializedATN; }

	@Override
	public String[] getChannelNames() { return channelNames; }

	@Override
	public String[] getModeNames() { return modeNames; }

	@Override
	public ATN getATN() { return _ATN; }

	public static final String _serializedATN =
		"\3\u608b\ua72a\u8133\ub9ed\u417c\u3be7\u7786\u5964\2\f`\b\1\4\2\t\2\4"+
		"\3\t\3\4\4\t\4\4\5\t\5\4\6\t\6\4\7\t\7\4\b\t\b\4\t\t\t\4\n\t\n\4\13\t"+
		"\13\3\2\3\2\3\2\3\2\3\3\3\3\3\3\3\4\3\4\3\5\3\5\3\6\3\6\3\7\6\7&\n\7\r"+
		"\7\16\7\'\3\b\6\b+\n\b\r\b\16\b,\3\t\3\t\3\t\3\t\3\t\3\t\3\t\3\t\3\t\3"+
		"\t\3\t\3\t\3\t\3\t\3\t\3\t\3\t\3\t\3\t\3\t\3\t\3\t\3\t\3\t\3\t\3\t\3\t"+
		"\3\t\3\t\3\n\3\n\3\n\3\n\3\n\3\n\3\n\3\n\3\n\3\n\3\n\3\n\3\n\3\n\3\n\3"+
		"\n\3\n\3\13\3\13\3\13\3\13\2\2\f\3\3\5\4\7\5\t\6\13\7\r\b\17\t\21\n\23"+
		"\13\25\f\3\2\6\5\2CFHHVV\4\2\62;ZZ\3\2C\\\5\2\13\f\17\17\"\"\2a\2\3\3"+
		"\2\2\2\2\5\3\2\2\2\2\7\3\2\2\2\2\t\3\2\2\2\2\13\3\2\2\2\2\r\3\2\2\2\2"+
		"\17\3\2\2\2\2\21\3\2\2\2\2\23\3\2\2\2\2\25\3\2\2\2\3\27\3\2\2\2\5\33\3"+
		"\2\2\2\7\36\3\2\2\2\t \3\2\2\2\13\"\3\2\2\2\r%\3\2\2\2\17*\3\2\2\2\21"+
		".\3\2\2\2\23K\3\2\2\2\25\\\3\2\2\2\27\30\7c\2\2\30\31\7p\2\2\31\32\7f"+
		"\2\2\32\4\3\2\2\2\33\34\7q\2\2\34\35\7t\2\2\35\6\3\2\2\2\36\37\7*\2\2"+
		"\37\b\3\2\2\2 !\7+\2\2!\n\3\2\2\2\"#\t\2\2\2#\f\3\2\2\2$&\t\3\2\2%$\3"+
		"\2\2\2&\'\3\2\2\2\'%\3\2\2\2\'(\3\2\2\2(\16\3\2\2\2)+\t\4\2\2*)\3\2\2"+
		"\2+,\3\2\2\2,*\3\2\2\2,-\3\2\2\2-\20\3\2\2\2./\7W\2\2/\60\7p\2\2\60\61"+
		"\7f\2\2\61\62\7g\2\2\62\63\7t\2\2\63\64\7i\2\2\64\65\7t\2\2\65\66\7c\2"+
		"\2\66\67\7f\2\2\678\7w\2\289\7c\2\29:\7v\2\2:;\7g\2\2;<\7\"\2\2<=\7U\2"+
		"\2=>\7g\2\2>?\7o\2\2?@\7g\2\2@A\7u\2\2AB\7v\2\2BC\7g\2\2CD\7t\2\2DE\7"+
		"\"\2\2EF\7n\2\2FG\7g\2\2GH\7x\2\2HI\7g\2\2IJ\7n\2\2J\22\3\2\2\2KL\7O\2"+
		"\2LM\7k\2\2MN\7p\2\2NO\7k\2\2OP\7o\2\2PQ\7w\2\2QR\7o\2\2RS\7\"\2\2ST\7"+
		"I\2\2TU\7t\2\2UV\7c\2\2VW\7f\2\2WX\7g\2\2XY\7\"\2\2YZ\7q\2\2Z[\7h\2\2"+
		"[\24\3\2\2\2\\]\t\5\2\2]^\3\2\2\2^_\b\13\2\2_\26\3\2\2\2\5\2\',\3\b\2"+
		"\2";
	public static final ATN _ATN =
		new ATNDeserializer().deserialize(_serializedATN.toCharArray());
	static {
		_decisionToDFA = new DFA[_ATN.getNumberOfDecisions()];
		for (int i = 0; i < _ATN.getNumberOfDecisions(); i++) {
			_decisionToDFA[i] = new DFA(_ATN.getDecisionState(i), i);
		}
	}
}