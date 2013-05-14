simple = {};

;(function(simple) {
  
  var nextToken = 1;
  
  simple.TOKENS = {};
  
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
    'EOF'
  ].forEach(function(tok) {
    simple.TOKENS[tok] = nextToken++;
  });
  
})(simple);