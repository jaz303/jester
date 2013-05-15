simple = {};

;(function(simple) {
  
  var nextToken = 1;
  
  simple.TOKENS = {};
  simple.TOKEN_NAMES = {};
  
  [ 'SUB',
    'ADD',
    'MUL',
    'DIV',
    'BANG',
    'LT',
    'GT',
    'LE',
    'GE',
    'EQ',
    'NEQ',
    'TILDE',
    'TRUE',
    'FALSE',
    'INTEGER',
    'HEX',
    'FLOAT',
    'STRING',
    'TRACE',
    'IDENT',
    'IF',
    'ELSE',
    'WHILE',
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
  
})(simple);