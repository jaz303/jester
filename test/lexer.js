var $ = require('./_prelude');

function testToken(input, token, value) {
    $.st(input, function(test) {
        
        var lexer = $.jester.lexer();
        lexer.setInput(input);

        test.ok(lexer.lex() === token);
        if (typeof value !== 'undefined') {
            test.ok(lexer.text() === value);
        }

        test.ok(lexer.lex() === 'EOF');

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

testTokens({

    '-'                 : 'SUB',
    '+'                 : 'ADD',
    '*'                 : 'MUL',
    '/'                 : 'DIV',
    '**'                : 'POW',
    '%'                 : 'MOD',
    '!'                 : 'BANG',
    '<'                 : 'LT',
    '>'                 : 'GT',
    '<='                : 'LE',
    '>='                : 'GE',
    '=='                : 'EQ',
    '!='                : 'NEQ',
    '&&'                : 'L_AND',
    '||'                : 'L_OR',
    '>>'                : 'R_SHIFT',
    '<<'                : 'L_SHIFT',
    '~'                 : 'TILDE',
    '&'                 : 'AMP',
    '|'                 : 'PIPE',
    '^'                 : 'HAT',
    '='                 : 'ASSIGN',
    '?'                 : 'QUESTION',
    ';'                 : 'SEMICOLON',
    ','                 : 'COMMA',
    
    '.'                 : 'DOT',
    ' .'                : 'DOT',
    '. '                : 'DOT',
    ' . '               : 'COMPOSE',
    '  .  '             : 'COMPOSE',

    '.{'                : 'LAMBDA_BRACE',
    '{'                 : 'L_BRACE',
    '}'                 : 'R_BRACE',
    '['                 : 'L_BRACKET',
    ']'                 : 'R_BRACKET',
    '('                 : 'L_PAREN',
    ')'                 : 'R_PAREN',
    
    'true'              : 'TRUE',
    'false'             : 'FALSE',
    'if'                : 'IF',
    'else'              : 'ELSE',
    'while'             : 'WHILE',
    'foreach'           : 'FOREACH',
    'loop'              : 'LOOP',
    'def'               : 'DEF',
    'my'                : 'MY',
    'return'            : 'RETURN',
    'import'            : 'IMPORT',
    'import!'           : 'IMPORT_BANG',
    'export'            : 'EXPORT',
    'export!'           : 'EXPORT_BANG',
    'trace'             : 'TRACE',
    'spawn'             : 'SPAWN',
    'eval'              : 'EVAL',
    'as'                : 'AS',

    '\n'                : 'NL',
    '\r'                : 'NL',
    '\r\n'              : 'NL',
    
    '#'                 : 'POUND',
    '#red'              : ['COLOR', '#red'],
    '#r_e_d'            : ['COLOR', '#r_e_d'],
    '#ff0000'           : ['COLOR', '#ff0000'],
    '#12345678'         : ['COLOR', '#12345678'],
    
    '$'                 : 'DOLLAR',
    '$foo'              : ['GLOBAL_IDENT', '$foo'],

    'foo'               : ['IDENT', 'foo'],
    'foo_bar'           : ['IDENT', 'foo_bar'],
    'a123'              : ['IDENT', 'a123'],
    '_abc'              : ['IDENT', '_abc'],

    '123'               : ['INTEGER', '123'],

    '1.5'               : ['FLOAT', '1.5'],
    '0.00001'           : ['FLOAT', '0.00001'],
    '5532.1112'         : ['FLOAT', '5532.1112'],

    // hex literals
    '0xff'              : ['HEX', '0xff'],
    '0xDEADBEEF'        : ['HEX', '0xDEADBEEF'],

    // binary literals
    '0b1'               : ['BINARY', '0b1'],
    '0b1100'            : ['BINARY', '0b1100'],

    // strings
    '""'                : ['STRING', '""'],
    '"foo"'             : ['STRING', '"foo"'],
    '"foo\\"bar"'       : ['STRING', '"foo\\"bar"']

});