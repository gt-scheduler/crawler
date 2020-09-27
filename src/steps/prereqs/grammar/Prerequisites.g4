grammar Prerequisites;

// This files defines the grammar expectedfrom the cleaned prerequisites section
// on a course details page on Oscar

// Parser rules
parse
    : expression // an input can contain either a set (multiple clauses joined with operators)
    | atom       // or a single clause
    | EOF
    ;

expression
    : left=term ( OR right=term)*
    ;
   
term
    : left=atom (AND right=atom)*
    ;

atom
    : course
    | test
    | (OPARENS expression CPARENS)
    ;
 
course
    : COURSE_PREFIX? subject=COURSE_SUBJECT number=COURSE_NUMBER (GRADE_PREFIX grade=GRADE_LETTER)?
    ;

test
    // Re-use course number here to avoid parse ambiguity
    : name=TEST_NAME score=COURSE_NUMBER
    ;


// Lexer rules
AND : 'and';
OR : 'or';
OPARENS : '(';
CPARENS : ')';

GRADE_LETTER
    : 'A'..'D'
    | 'T'
    ;

COURSE_PREFIX
    : 'Undergraduate Semester level'
    | 'Graduate Semester level'
    ;

GRADE_PREFIX
    : 'Minimum Grade of'
    ;

TEST_NAME
    : 'SAT Mathematics'
    | 'MATH SECTION SCORE'
    | 'ACT Math'
    | 'Converted ACT Math'
    | 'Math: Calculus AB'
    | 'Math: Calculus BC'
    ;

COURSE_NUMBER
    : [0-9X]+[A-Z]*
    ;

COURSE_SUBJECT
    : [A-Z]+
    ;

SPACE
    : [ \t\r\n] -> skip
    ;
