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
    | (OPARENS expression CPARENS)
    ;
 
course
    : COURSE_PREFIX subject number GRADE_PREFIX grade
    ;

subject
    : COURSE_SUBJECT
    ;

number
    : COURSE_NUMBER
    ;

grade
    : GRADE_LETTER
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

COURSE_NUMBER
    : [0-9X]+
    ;

COURSE_SUBJECT
    : [A-Z]+
    ;

COURSE_PREFIX
    : 'Undergraduate Semester level'
    ;

GRADE_PREFIX
    : 'Minimum Grade of'
    ;

SPACE
    : [ \t\r\n] -> skip
    ;
