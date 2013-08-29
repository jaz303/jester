var TOKENS       = {};
var TOKEN_NAMES  = {};

var nextToken = 1;

[   'SUB',        // -
    'ADD',        // +
    'MUL',        // *
    'DIV',        // /
    'BANG',       // !
    'LT',         // <
    'GT',         // >
    'LE',         // <=
    'GE',         // >=
    'EQ',         // ==
    'NEQ',        // !=
    'LAND',       // &&
    'LOR',        // ||
    'TILDE',      // ~
    'TRUE',       // true
    'FALSE',      // false
    'INTEGER',
    'HEX',
    'BINARY',
    'FLOAT',
    'STRING',
    'COLOR',
    'TRACE',
    'IDENT',
    'IF',
    'ELSE',
    'WHILE',
    'LOOP',
    'DEF',
    'L_BRACE',
    'R_BRACE',
    'L_BRACKET',
    'R_BRACKET',
    'L_PAREN',
    'R_PAREN',
    'SEMICOLON',
    'NEWLINE',
    'IDENT',
    'COMMA',
    'RETURN',
    'ASSIGN',
    'EOF',
    'ERROR'
].forEach(function(tok) {
    var tokenId = nextToken++;
    TOKENS[tok] = tokenId;
    TOKEN_NAMES[tokenId] = tok;
});

exports.tokens = TOKENS;
exports.names = TOKEN_NAMES;