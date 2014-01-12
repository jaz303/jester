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
    '**'                : T.POW,
    '%'                 : T.MOD,
    '!'                 : T.BANG,
    '<'                 : T.LT,
    '>'                 : T.GT,
    '<='                : T.LE,
    '>='                : T.GE,
    '=='                : T.EQ,
    '!='                : T.NEQ,
    '&&'                : T.L_AND,
    '||'                : T.L_OR,
    '>>'                : T.R_SHIFT,
    '<<'                : T.L_SHIFT,
    '~'                 : T.TILDE,
    '&'                 : T.AMP,
    '|'                 : T.PIPE,
    '^'                 : T.HAT,
    '='                 : T.ASSIGN,
    '?'                 : T.QUESTION,
    ';'                 : T.SEMICOLON,
    ','                 : T.COMMA,
    '.'                 : T.DOT,
    '.{'                : T.LAMBDA_BRACE,
    '{'                 : T.L_BRACE,
    '}'                 : T.R_BRACE,
    '['                 : T.L_BRACKET,
    ']'                 : T.R_BRACKET,
    '('                 : T.L_PAREN,
    ')'                 : T.R_PAREN,
    
    'true'              : T.TRUE,
    'false'             : T.FALSE,
    'if'                : T.IF,
    'else'              : T.ELSE,
    'while'             : T.WHILE,
    'foreach'           : T.FOREACH,
    'loop'              : T.LOOP,
    'def'               : T.DEF,
    'my'                : T.MY,
    'return'            : T.RETURN,
    'import'            : T.IMPORT,
    'import!'           : T.IMPORT_BANG,
    'export'            : T.EXPORT,
    'export!'           : T.EXPORT_BANG,
    'trace'             : T.TRACE,
    'spawn'             : T.SPAWN,
    'eval'              : T.EVAL,
    'as'                : T.AS,

    '\n'                : T.NEWLINE,
    '\r'                : T.NEWLINE,
    '\r\n'              : T.NEWLINE,

    ' '                 : T.SPACE,
    '\t'                : T.SPACE,
    '    \t   '         : T.SPACE,

    '#'                 : T.POUND,
    '#red'              : [T.COLOR, '#red'],
    '#r_e_d'            : [T.COLOR, '#r_e_d'],
    '#ff0000'           : [T.COLOR, '#ff0000'],
    
    '$'                 : T.DOLLAR,
    '$foo'              : [T.GLOBAL_IDENT, '$foo'],

    'foo'               : [T.IDENT, 'foo'],
    'foo_bar'           : [T.IDENT, 'foo_bar'],
    'a123'              : [T.IDENT, 'a123'],
    '_abc'              : [T.IDENT, '_abc'],

    '123'               : [T.INTEGER, '123'],

    '1.5'               : [T.FLOAT, '1.5'],
    '0.00001'           : [T.FLOAT, '0.00001'],
    '5532.1112'         : [T.FLOAT, '5532.1112'],

    // hex literals
    '0xff'              : [T.HEX, '0xff'],
    '0xDEADBEEF'        : [T.HEX, '0xDEADBEEF'],

    // binary literals
    '0b1'               : [T.BINARY, '0b1'],
    '0b1100'            : [T.BINARY, '0b1100'],

    // strings
    '""'                : [T.STRING, '""'],
    '"foo"'             : [T.STRING, '"foo"'],
    '"foo\\"bar"'       : [T.STRING, '"foo\\"bar"']

});