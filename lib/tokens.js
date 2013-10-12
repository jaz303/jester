"use strict";

var TOKENS       = {};
var TOKEN_NAMES  = {};

var nextToken = 1;

[   'SUB',          // -
    'ADD',          // +
    'MUL',          // *
    'DIV',          // /
    'BANG',         // !
    'LT',           // <
    'GT',           // >
    'LE',           // <=
    'GE',           // >=
    'EQ',           // ==
    'NEQ',          // !=
    'LAND',         // &&
    'LOR',          // ||
    'TILDE',        // ~
    'L_BRACE',      // {
    'R_BRACE',      // }
    'L_BRACKET',    // [
    'R_BRACKET',    // ]
    'L_PAREN',      // (
    'R_PAREN',      // )
    'COMMA',        // ,
    'SEMICOLON',    // ;
    'ASSIGN',       // =
    'NEWLINE',      // \n

    'TRUE',         // true
    'FALSE',        // false
    'NULL',         // null
    'IF',           // if
    'ELSE',         // else
    'WHILE',        // while
    'LOOP',         // loop
    'DEF',          // def
    'RETURN',       // return
    'TRACE',        // trace
    'SPAWN',        // spawn
    'EVAL',         // eval

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
].forEach(function(tok) {
    var tokenId = nextToken++;
    TOKENS[tok] = tokenId;
    TOKEN_NAMES[tokenId] = tok;
});

exports.tokens = TOKENS;
exports.names = TOKEN_NAMES;
