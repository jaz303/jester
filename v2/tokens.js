var TOKENS_TO_SYMBOLS   = {},
    SYMBOLS_TO_TOKENS   = {},
    KEYWORDS            = {};

function addSymbols(syms) {
    for (var s in syms) {
        TOKENS_TO_SYMBOLS[s] = syms[s];
        SYMBOLS_TO_TOKENS[syms[s]] = s;
    }
}

function addTokens(tokens) {
    // no-op
}

function addKeywords(kws) {
    addSymbols(kws);
    for (var k in kws) {
        KEYWORDS[kws[k]] = k;
    }
}

addSymbols({
    'SUB'           : '-',
    'ADD'           : '+',
    'MUL'           : '*',
    'DIV'           : '/',
    'POW'           : '**',
    'MOD'           : '%',
    'BANG'          : '!',
    'LT'            : '<',
    'GT'            : '>',
    'LE'            : '<=',
    'GE'            : '>=',
    'EQ'            : '==',
    'NEQ'           : '!=',
    'L_AND'         : '&&',
    'L_OR'          : '||',
    'L_SHIFT'       : '<<',
    'R_SHIFT'       : '>>',
    'AMP'           : '&',
    'PIPE'          : '|',
    'HAT'           : '^',
    'TILDE'         : '~',
    'ASSIGN'        : '=',
    'QUESTION'      : '?',
    'SEMICOLON'     : ';',
    'COMMA'         : ',',
    'DOT'           : '.',
    'COMPOSE'       : ' . ',
    'LAMBDA_BRACE'  : '.{',
    'L_BRACE'       : '{',
    'R_BRACE'       : '}',
    'L_BRACKET'     : '[',
    'R_BRACKET'     : ']',
    'L_PAREN'       : '(',
    'R_PAREN'       : ')'
});

addTokens([
    'NEWLINE',          // \n

    'IDENT',
    'DOLLAR',
    'GLOBAL_IDENT',
    'INTEGER',
    'FLOAT',
    'HEX',
    'BINARY',
    'STRING',
    'POUND',
    'COLOR',
    'IDENT',

    'EOF',          // <eof>
    'ERROR'         // <error>
]);

addKeywords({
    'TRUE'          : 'true',
    'FALSE'         : 'false',
    'NULL'          : 'null',
    'IF'            : 'if',
    'ELSE'          : 'else',
    'WHILE'         : 'while',
    'LOOP'          : 'loop',
    'DEF'           : 'def',
    'TRACE'         : 'trace',
    'SPAWN'         : 'spawn',
    'EVAL'          : 'eval',
    'MY'            : 'my',
    'FOREACH'       : 'foreach',
    'RETURN'        : 'return',
    'IMPORT'        : 'import',
    'IMPORT_BANG'   : 'import!',
    'EXPORT'        : 'export',
    'EXPORT_BANG'   : 'export!',
    'AS'            : 'as'
});

exports.symbolsToTokens = SYMBOLS_TO_TOKENS;
exports.tokensToSymbols = TOKENS_TO_SYMBOLS;
exports.keywords        = KEYWORDS;