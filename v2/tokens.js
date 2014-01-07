var TOKENS          = {},
    TOKEN_NAMES     = {},
    KEYWORDS        = {},
    nextToken       = 1;

function addToken(name) {
    var tokenId = nextToken++;
    TOKENS[name] = tokenId;
    TOKEN_NAMES[tokenId] = name;
    return tokenId;
}

function addTokens(list) {
    list.forEach(addToken);
}

function addKeywords(kws) {
    for (var k in kws) {
        KEYWORDS[kws[k]] = addToken(k);
    }
}

addTokens([
    'SUB',              // -
    'ADD',              // +
    'MUL',              // *
    'DIV',              // /
    'BANG',             // !
    'LT',               // <
    'GT',               // >
    'LE',               // <=
    'GE',               // >=
    'EQ',               // ==
    'NEQ',              // !=
    'LAND',             // &&
    'LOR',              // ||
    'TILDE',            // ~
    'L_BRACE',          // {
    'R_BRACE',          // }
    'L_BRACKET',        // [
    'R_BRACKET',        // ]
    'L_PAREN',          // (
    'R_PAREN',          // )
    'COMMA',            // ,
    'SEMICOLON',        // ;
    'ASSIGN',           // =
    'NEWLINE',          // \n

    'IDENT',
    'GLOBAL_IDENT',
    'INTEGER',
    'HEX',
    'BINARY',
    'FLOAT',
    'STRING',
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
    'EXPORT_BANG!'  : 'export!'
});

exports.tokens = TOKENS;
exports.names = TOKEN_NAMES;
exports.keywords = KEYWORDS;