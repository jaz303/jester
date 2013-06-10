simple = {};

;(function(simple) {
  
  simple.TOKENS       = {};
  simple.TOKEN_NAMES  = {};
  simple.AST_NODES    = {};
  
  var nextToken = 1;
  
  [ 'SUB',        // -
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
    simple.TOKENS[tok] = tokenId;
    simple.TOKEN_NAMES[tokenId] = tok;
  });
  
  var nextAstNode = 1;
  
  [ 'DEF',
    'IF',
    'WHILE',
    'LOOP',
    'RETURN',
    'YIELD',
    'COLOR',
    'ASSIGN',
    'TRACE',
    'IDENT',
    'CALL',
    'BIN_OP',
    'UN_OP'
  ].forEach(function(ast) {
    var astNodeId = nextAstNode++;
    simple.AST_NODES[ast] = astNodeId;
  });
  
})(simple);