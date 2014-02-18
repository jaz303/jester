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

addTokens([
    'NL',               // \n

    'IDENT',
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
    'IN'            : 'in',
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