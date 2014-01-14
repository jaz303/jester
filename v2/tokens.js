var TOKENS              = {},
    TOKEN_NAMES         = {},
    TOKENS_TO_SYMBOLS   = {},
    SYMBOLS_TO_TOKENS   = {},
    SYMBOLS             = {},
    KEYWORDS            = {},
    nextToken           = 1;

function addToken(name) {
    var tokenId = nextToken++;
    TOKENS[name] = tokenId;
    TOKEN_NAMES[tokenId] = name;
    return tokenId;
}

function addSymbols(syms) {
    for (var s in syms) {
        var token = addToken(s);
        TOKENS_TO_SYMBOLS[token] = syms[s];
        SYMBOLS_TO_TOKENS[syms[s]] = token;
    }
}

function addTokens(list) {
    list.forEach(addToken);
}

function addKeywords(kws) {
    for (var k in kws) {
        KEYWORDS[kws[k]] = addToken(k);
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
    'ASSIGN'        : '=',
    'QUESTION'      : '?',
    'SEMICOLON'     : ';',
    'COMMA'         : ',',
    'DOT'           : '.',
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

exports.tokens          = TOKENS;
exports.names           = TOKEN_NAMES;
exports.symbolsToTokens = SYMBOLS_TO_TOKENS;
exports.tokensToSymbols = TOKENS_TO_SYMBOLS;
exports.keywords        = KEYWORDS;