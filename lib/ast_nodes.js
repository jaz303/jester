"use strict";

var AST_NODES    = {};

var nextAstNode = 1;

[   'MODULE',
    'DEF',
    'IF',
    'WHILE',
    'LOOP',
    'RETURN',
    'YIELD',
    'COLOR',
    'ASSIGN',
    'TRACE',
    'IDENT',
    'GLOBAL_IDENT',
    'CALL',
    'BIN_OP',
    'UN_OP',
    'SPAWN',
    'EVAL'
].forEach(function(ast) {
    var astNodeId = nextAstNode++;
    AST_NODES[ast] = astNodeId;
});

module.exports = AST_NODES;
