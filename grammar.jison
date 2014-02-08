%lex

%%

" "+"."" "+                     return 'COMPOSE';
(\r?\n|\r)                      return 'NL';

\s+                             /* skip whitespace */

"\""(\\[\\"rnt]|[^\\"])*"\""    return 'STRING';

"#"[0-9a-fA-F]{6}               return 'COLOR';
"#"[0-9a-fA-F]{8}               return 'COLOR';
"#"[a-zA-Z_]+                   return 'NAMED_COLOR';

"0b"[01][01_]+                  return 'BINARY';
"0x"[0-9a-fA-F][0-9a-fA-F_]+    return 'HEX';
[0-9][0-9_]+"."[0-9][0-9_]+     return 'FLOAT';
[0-9][0-9_]+                    return 'INTEGER';

"def"                           return 'DEF';
"while"                         return 'WHILE';
"loop"                          return 'LOOP';
"foreach"                       return 'FOREACH';
"in"                            return 'IN';
"yield"                         return 'YIELD';
"spawn"                         return 'SPAWN';
"wait"                          return 'WAIT';
"true"                          return 'TRUE';
"false"                         return 'FALSE';
"trace"                         return 'TRACE';
"if"                            return 'IF';
"else"                          return 'ELSE';
"return"                        return 'RETURN';

[a-zA-Z_][a-zA-Z0-9_]*[\!\?]    return 'PUNCTUATED_IDENT';
[a-zA-Z_][a-zA-Z0-9_]*          return 'IDENT';
"$"[a-zA-Z0-9_]+                return 'GLOBAL_IDENT';

"$"                             return '$';

".{"                            return '.{';
"{"                             return '{';
"}"                             return '}';
"("                             return '(';
")"                             return ')';
"["                             return '[';
"]"                             return ']';

"?"                             return 'PARTIAL';

"=="                            return '==';
"!="                            return '!=';
"<"                             return '<';
"<="                            return '<=';
">"                             return '>';
">="                            return '>=';

"="                             return '=';

"**"                            return '**';
"*"                             return '*';
"/"                             return '/';
"+"                             return '+';
"-"                             return '-';
"^"                             return '^';
"%"                             return '%';
"<<"                            return '<<';
">>"                            return '>>';

"&&"                            return '&&';
"||"                            return '||';

"&"                             return '&';
"|"                             return '|';

"!"                             return '!';
"~"                             return '~';
";"                             return ';';
","                             return ',';
"."                             return '.';

<<EOF>>                         return 'EOF';

/lex

/*
 * TODO
 *
 * Array literal
 * Array access
 * Dictionary literal
 * Dictionary access
 * Vectors
 * Color constructor
 * Spawn
 * Compose operator
 *
 */

%right '='
%left '||'
%left '&&'
%left '|'
%left '^'
%left '&'
%left '==' '!='
%left '<' '<=' '>' '>='
%left '<<' '>>'
%left '+' '-'
%left '*' '/' '%' '**'
%right WAIT

%start module

%%

module
    : statements EOF ;

st
    : ';'
    | NL
    ;

statements
    : st*                   {{ $$ = []; }}
    | st* statements_inner  {{ $$ = $2; }}
    ;

/*
 * Three cases here:
 *
 * 1) single statement, no trailing terminators
 *    { foo }
 * 2) 1 or more statements, trailing terminators
 *    { foo; bar; }
 * 3) 2 or more statements, no trailing terminators
 *    { foo; bar }
 *
 */
statements_inner
    : trailing_statement                        {{ $$ = [$1]; }}
    | leading_statements                        {{ $$ = $1; }}
    | leading_statements trailing_statement     {{ $1.push($2); $$ = $1; }}
    ;

leading_statements
    : leading_statement                         {{ $$ = [$1]; }}
    | leading_statements leading_statement      {{ $1.push($2); $$ = $1; }}
    ;

leading_statement
    : block_statement st*                       {{ $$ = $1; }}
    | inline_statement st+                      {{ $$ = $1; }}
    ;

trailing_statement
    : block_statement                           {{ $$ = $1; }}
    | inline_statement                          {{ $$ = $1; }}
    ;

block_statement
    : while_statement
    | unconditional_loop_statement
    | conditional_loop_statement
    | foreach_statement
    | if_statement
    | function_definition
    ;

inline_statement
    : exp
    | YIELD
    ;

block
    : '{' statements '}' ;

while_statement
    : WHILE exp NL* block
        {{ $$ = [A.WHILE, $2, $4]; }}
    ;

unconditional_loop_statement
    : LOOP NL* block
        {{ $$ = [A.LOOP, true, $3]; }}
    ;

conditional_loop_statement
    : LOOP WHILE exp NL* block
        {{ $$ = [A.LOOP, $3, $5]; }}
    ;

foreach_statement
    : FOREACH foreach_iterator IN exp NL* block
    ;

foreach_iterator
    : IDENT ',' IDENT
    | IDENT
    ;

if_statement
    : IF exp NL* block else_ifs? else? ;

else_ifs
    : else_if
    | else_ifs else_if
    ;
    
else_if
    : ELSE IF NL* block ;

else
    : ELSE NL* block ;

function_definition
    : DEF function_name function_params NL* block
    | DEF function_name NL* block
    ;

function_name
    : PUNCTUATED_IDENT
    | IDENT
    ;

function_params
    : '(' ')'
    | '(' function_params_list ')'
    ;

function_params_list
    : function_param
    | function_params_list ',' function_param
    ;

function_param
    : IDENT '=' literal
    | IDENT
    ;

return_statement
    : RETURN exp        {{ $$ = [T.RETURN, $2]; }}
    | RETURN            {{ $$ = [T.RETURN]; }}
    ;

exp
    : exp '+' exp       {{ $$ = [T.BIN_OP, '+', $1, $3]; }}
    | exp '-' exp       {{ $$ = [T.BIN_OP, '-', $1, $3]; }}
    | exp '<<' exp      {{ $$ = [T.BIN_OP, '<<', $1, $3]; }}
    | exp '>>' exp      {{ $$ = [T.BIN_OP, '>>', $1, $3]; }}
    | exp '<' exp       {{ $$ = [T.BIN_OP, '<', $1, $3]; }}
    | exp '<=' exp      {{ $$ = [T.BIN_OP, '<=', $1, $3]; }}
    | exp '>' exp       {{ $$ = [T.BIN_OP, '>', $1, $3]; }}
    | exp '>=' exp      {{ $$ = [T.BIN_OP, '>=', $1, $3]; }}
    | exp '==' exp      {{ $$ = [T.BIN_OP, '==', $1, $3]; }}
    | exp '!=' exp      {{ $$ = [T.BIN_OP, '!=', $1, $3]; }}
    | exp '&' exp       {{ $$ = [T.BIN_OP, '&', $1, $3]; }}
    | exp '*' exp       {{ $$ = [T.BIN_OP, '*', $1, $3]; }}
    | exp '/' exp       {{ $$ = [T.BIN_OP, '/', $1, $3]; }}
    | exp '%' exp       {{ $$ = [T.BIN_OP, '%', $1, $3]; }}
    | exp '**' exp      {{ $$ = [T.BIN_OP, '**', $1, $3]; }}
    | exp '^' exp       {{ $$ = [T.BIN_OP, '^', $1, $3]; }}
    | exp '|' exp       {{ $$ = [T.BIN_OP, '|', $1, $3]; }}
    | exp '&&' exp      {{ $$ = [T.BIN_OP, '&&', $1, $3]; }}
    | exp '||' exp      {{ $$ = [T.BIN_OP, '||', $1, $3]; }}
    | exp '=' exp       {{ $$ = [T.BIN_OP, '=', $1, $3]; }}
    | primary
    ;

primary
    : atom
    | lambda
    | WAIT exp          {{ $$ = [T.WAIT, $2]; }}
    | '(' exp ')'       {{ $$ = $2; }}
    ;

atom
    : GLOBAL_IDENT      {{ $$ = [T.GLOBAL_IDENT, yytext]; }}
    | PUNCTUATED_IDENT  {{ $$ = [T.IDENT, yytext]; }}
    | IDENT
    | '$'
    | TRACE
    | literal
    ;

literal
    : COLOR
    | NAMED_COLOR
    | BINARY
    | HEX
    | FLOAT
    | INTEGER
    | TRUE
    | FALSE
    | STRING
    ;

/*
 * Lambda
 */

lambda
    : '.{' lambda_args statements '}'   {{ $$ = [T.LAMBDA, $2, $3]; }}
    | '.{' statements '}'               {{ $$ = [T.LAMBDA, [], $2]; }}
    ;

lambda_args
    : lambda_args_list '|' ;

lambda_args_list
    : IDENT                             {{ $$ = [$1]; }}
    | lambda_args_list ',' IDENT        {{ $1.push($3); $$ = $1; }}
    ;

/*
 * Array literal
 */


/*
 * Call
 */

call
    : exp '(' call_args_list? ')' ;

call_args_list
    : exp
    | call_args_list ',' exp
    ;

/*
 * Call without parens
 * e.g. "foo 1, 2, 3"
 *
 * This is requires its own sub-grammar...
 */

call_without_paren
    : exp call_without_paren_args ;

call_without_paren_args
    : wop_exp
    | call_without_paren_args ',' wop_exp
    ;

wop_exp
    : primary ;