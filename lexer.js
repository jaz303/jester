;(function(simple, global) {
  
  var T = simple.TOKENS;
  
  var KEYWORDS = {
    'if'        : T.IF,
    'else'      : T.ELSE,
    'while'     : T.WHILE,
    'def'       : T.DEF,
    'trace'     : T.TRACE,
    'return'    : T.RETURN,
    'true'      : T.TRUE,
    'false'     : T.FALSE
  };
  
  var SINGLES = {
    '-'         : T.SUB,
    '+'         : T.ADD,
    '*'         : T.MUL,
    '/'         : T.DIV,
    '~'         : T.TILDE,
    '{'         : T.L_BRACE,
    '}'         : T.R_BRACE,
    '['         : T.L_BRACKET,
    ']'         : T.R_BRACKET,
    '('         : T.L_PAREN,
    ')'         : T.R_PAREN,
    ';'         : T.SEMICOLON,
    ','         : T.COMMA,
    '\n'        : T.NEWLINE
  };
  
  function space_p(ch) {
    return ch === ' ' || ch === '\t';
  }
  
  function hex_digit_p(ch) {
    var c = ch.charCodeAt(0);
    return (c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102);
  }
  
  function digit_p(ch) {
    var c = ch.charCodeAt(0);
    return c >= 48 && c <= 57;
  }
  
  function ident_start_p(ch) {
    var c = ch.charCodeAt(0);
    return (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c == 95);
  }
  
  function ident_rest_p(ch) {
    return ident_start_p(ch) || digit_p(ch);
  }
  
  simple.createLexer = function(src) {
    
    var p     = 0,
        tok   = null,
        len   = src.length,
        text  = null,
        start = null,
        error = null;
    
    function more() { return p < len - 1; }
    function two_more() { return p < len - 2; }
    
    function nextToken() {
      
      text = null;
      
      if (p === len)
        return T.EOF;
      
      // skip whitespace
      while (space_p(src[p])) {
        if (++p === len)
          return T.EOF;
      }
      
      // skip comments
      if (src[p] === '-' && more() && src[p+1] === '-') {
        p += 2;
        while (true) {
          if (p === len)
            return T.EOF;
          if (src[p] === '\r' || src[p] === '\n')
            break;
          ++p;
        }
      }
      
      if ((tok = SINGLES[src[p]])) {
        ++p;
        return tok;
      }
      
      var ch = src[p];
      switch (ch) {
        case '!':
          if (more() && src[p+1] === '=') {
            ++p;
            tok = T.NEQ;
          } else {
            tok = T.BANG;
          }
          break;
        case '<':
          if (more() && src[p+1] === '=') {
            ++p;
            tok = T.LE;
          } else {
            tok = T.LT;
          }
          break;
        case '>':
          if (more() && src[p+1] === '=') {
            ++p;
            tok = T.GE;
          } else {
            tok = T.GT;
          }
          break;
        case '=':
          if (more() && src[p+1] === '=') {
            ++p;
            tok = T.EQ;
          } else {
            tok = T.ASSIGN;
          }
          break;
        case '\r':
          if (more() && src[p+1] === '\n') {
            ++p;
          }
          tok = T.NEWLINE;
          break;
        default:
          if (ident_start_p(ch)) {
            
            start = p;
            while (more() && ident_rest_p(src[p+1]))
              ++p;
            
            text = src.substring(start, p + 1);
            tok = KEYWORDS[text] || T.IDENT;
            
          } else if (digit_p(ch)) {
            
            if (ch === '0' && two_more() && src[p+1] === 'x' && hex_digit_p(src[p+2])) {
              
              start = p;
              p += 2;
              
              while (more() && hex_digit_p(src[p+1]))
                ++p;
              
              text = src.substring(start, p + 1);
              tok = T.HEX;
              
            } else {
              
              start = p;
              
              while (more() && digit_p(src[p+1]))
                ++p;
                
              if (more() && src[p+1] === '.') {
                ++p;
                if (!more() || !digit_p(src[p+1])) {
                  error = "invalid float literal";
                  tok = T.ERROR;
                } else {
                  while (more() && digit_p(src[p+1]))
                    ++p;
                  text = src.substring(start, p + 1);
                  tok = T.FLOAT;
                }
              } else {
                text = src.substring(start, p + 1);
                tok = T.INTEGER;
              }
              
            }
            
          } else if (ch === '"') {
            
            var skip = false;
            
            start = p;
            
            error = "unterminated string literal";
            tok = T.ERROR;
            
            while (more()) {
              ++p;
              if (skip) {
                skip = false;
              } else if (src[p] === '\\') {
                skip = true;
              } else if (src[p] === '"') {
                text = src.substring(start + 1, p); // TODO: parse string
                error = null;
                tok = T.STRING;
                break;
              }
            }
            
          } else {
            error = "unexpected character: '" + ch + "'";
            tok = T.ERROR;
          }
          
          break;
      }
      
      ++p;
      return tok;
 
    }
    
    return {
      nextToken     : nextToken,
      text          : function() { return text; },
      error         : function() { return error; }
    };
    
  };
  
})(simple, this);