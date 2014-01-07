var $ = require('./_prelude');

function testToken(input, token, value) {
    $.st(input, function(test) {
        
        var lexer = $.jester.lexer(input);

        test.ok(lexer.next() === token);
        if (typeof value !== 'undefined') {
            test.ok(lexer.text() === value);
        }

        test.ok(lexer.next() === T.EOF);

    });
}

function testTokens(tests) {
    for (var input in tests) {
        if (Array.isArray(tests[input])) {
            testToken(input, tests[input][0], tests[input][1]);
        } else {
            testToken(input, tests[input]);
        }
    }
}

var T = $.jester.tokens;

testTokens({

    '-'                 : T.SUB,
    '+'                 : T.ADD,
    '*'                 : T.MUL,
    '/'                 : T.DIV,
    // '**'                : T.POW,
    //'%'                 : T.MOD,

    // '>>'                : T.RSHIFT,
    // '<<'                : T.LSHIFT,


    '!'                 : T.BANG,
    '<'                 : T.LT,
    '>'                 : T.GT,
    '<='                : T.LE,
    '>='                : T.GE,
    '=='                : T.EQ,
    '!='                : T.NEQ,
    // '&&'                : T.ANDAND,
    // '||'                : T.OROR,
    // '~'                 : T.TILDE,
    
    '{'                 : T.L_BRACE,
    '}'                 : T.R_BRACE,
    '['                 : T.L_BRACKET,
    ']'                 : T.R_BRACKET,
    '('                 : T.L_PAREN,
    ')'                 : T.R_PAREN,

    ','                 : T.COMMA,
    // '.'                 : T.DOT,
    ';'                 : T.SEMICOLON,
    '='                 : T.ASSIGN,
    
    'true'              : T.TRUE,
    'false'             : T.FALSE,
    'if'                : T.IF,
    'else'              : T.ELSE,
    'while'             : T.WHILE,
    // 'foreach'           : T.FOREACH,
    'loop'              : T.LOOP,
    'def'               : T.DEF,
    // 'my'                : T.MY,
    'return'            : T.RETURN,
    // 'import'            : T.IMPORT,
    // 'import!'           : T.IMPORT_BANG,
    // 'export'            : T.EXPORT,
    // 'export!'           : T.EXPORT_BANG,
    'trace'             : T.TRACE,
    'spawn'             : T.SPAWN,
    'eval'              : T.EVAL,

    '\n'                : T.NEWLINE,
    // ' '                 : T.SPACE,
    // '\t'                : T.SPACE,
    // '    \t   '         : T.SPACE,

    // '#red'              : [T.COLOR, 'red'],
    // '#ff0000'           : [T.COLOR, 'ff0000'],
    // '#'                 : T.COLOR_CTOR,

    // '$'                 : T.DOLLAR,
    // '$foo'              : [T.GLOBAL, 'foo']

});