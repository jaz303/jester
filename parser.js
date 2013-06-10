;(function(global, simple) {
  
  var T = simple.TOKENS;
  
  var TOKEN_OP = {};
  TOKEN_OP[T.SUB]   = '-';
  TOKEN_OP[T.ADD]   = '+';
  TOKEN_OP[T.MUL]   = '*';
  TOKEN_OP[T.DIV]   = '/';
  TOKEN_OP[T.BANG]  = '!';
  TOKEN_OP[T.TILDE] = '~';
  TOKEN_OP[T.LT]    = '<';
  TOKEN_OP[T.GT]    = '>';
  TOKEN_OP[T.LE]    = '<=';
  TOKEN_OP[T.GE]    = '>=';
  TOKEN_OP[T.EQ]    = '==';
  TOKEN_OP[T.NEQ]   = '!=';
  TOKEN_OP[T.LAND]  = 'logical-and';
  TOKEN_OP[T.LOR]   = 'logical-or';
  
  // these are the tokens that can follow an identifier to allow
  // a function call without parens e.g.
  // foo 1, 2, 3
  var EXP_START_TOKENS = {};
  EXP_START_TOKENS[T.BANG]    = true;
  EXP_START_TOKENS[T.TILDE]   = true;
  EXP_START_TOKENS[T.TRUE]    = true;
  EXP_START_TOKENS[T.FALSE]   = true;
  EXP_START_TOKENS[T.INTEGER] = true;
  EXP_START_TOKENS[T.HEX]     = true;
  EXP_START_TOKENS[T.FLOAT]   = true;
  EXP_START_TOKENS[T.STRING]  = true;
  EXP_START_TOKENS[T.TRACE]   = true;
  EXP_START_TOKENS[T.IDENT]   = true;
  EXP_START_TOKENS[T.COLOR]   = true;
  
  function ParseError(message, line, column, expectedToken, actualToken) {
    this.name = "ParseError";
    this.message = message;
    this.sourceLine = line;
    this.sourceColumn = column;
    this.expectedToken = expectedToken;
    this.actualToken = actualToken;
  }
  
  ParseError.prototype = new Error();
  ParseError.prototype.constructor = ParseError;
  
  simple.ParseError = ParseError;
  
  simple.createParser = function(lexer) {
    
    var curr = null;
    
    function next() {
      curr = lexer.nextToken();
    }
    
    function text() {
      return lexer.text();
    }
    
    function accept(token, msg) {
      if (curr !== token) {
        error(msg || "parse error", token);
      } else {
        next();
      }
    }
    
    function error(msg, expectedToken) {
      if (curr === T.ERROR) {
        msg = lexer.error();
      }
      throw new ParseError(
        msg,
        lexer.line(),
        lexer.column(),
        expectedToken ? simple.TOKEN_NAMES[expectedToken] : null,
        simple.TOKEN_NAMES[curr]
      )
    }
    
    function decodeColor(text) {
      var resolved  = simple.COLOR_NAMES[text.substring(1).replace(/_/g, '').toLowerCase()],
          hex       = resolved || text,
          matches   = null;
      
      if (matches = hex.match(/^#([0-9a-z]{2})([0-9a-z]{2})([0-9a-z]{2})([0-9a-z]{2})?$/i)) {
        return {
          type  : 'color',
          r     : parseInt(matches[1], 16),
          g     : parseInt(matches[2], 16),
          b     : parseInt(matches[3], 16),
          a     : (typeof matches[4] === 'string') ? parseInt(matches[4], 16) : 255
        };
      } else {
        error("Invalid color literal '" + text + "'. Color literals should be 6/8 character hex strings, or valid color names.");
      }
    }
    
    function at(token)                  { return curr === token; }
    function atBlockTerminator()        { return curr === T.R_BRACE; }
    function atStatementTerminator()    { return curr === T.SEMICOLON || curr === T.NEWLINE; }
    function skipNewlines()             { while (curr === T.NEWLINE) next(); }
    function skipStatementTerminators() { while (atStatementTerminator()) next(); }
    function atExpStart()               { return !!EXP_START_TOKENS[curr]; }
    
    function parseFormalParameterList() {
      var params = [];
      
      if (!at(T.IDENT)) {
        return params;
      }
      
      params.push(text());
      next();
      
      while (at(T.COMMA)) {
        next();
        if (at(T.IDENT)) {
          params.push(text());
        }
        accept(T.IDENT, "expected: parameter name (identifier)");
      }
      
      return params;
    }
    
    function parseFunctionDefinition() {
      var line = lexer.line();
      
      accept(T.DEF);
      
      var node = { type: 'def', line: line };
      
      if (at(T.IDENT)) {
        node.name = text();
      }
      
      accept(T.IDENT, "expected: function name (identifier)");
      
      if (at(T.L_PAREN)) {
        accept(T.L_PAREN);
        node.parameters = parseFormalParameterList();
        accept(T.R_PAREN);
      } else {
        node.parameters = [];
      }
      
      skipNewlines();
      
      node.body = parseStatementBlock();
      
      return node;
    }
    
    function parseIfStatement() {
      var line = lexer.line();
      
      accept(T.IF);
      var node = { type: 'if', line: line, clauses: [] };
      
      var cond = parseExpression();
      skipNewlines();
      node.clauses.push({ condition: cond, body: parseStatementBlock() });
      skipNewlines();
      
      while (at(T.ELSE)) {
        next();
        if (at(T.IF)) {
          next();
          cond = parseExpression();
          skipNewlines();
          node.clauses.push({ condition: cond, body: parseStatementBlock() });
          skipNewlines();
        } else {
          skipNewlines();
          node.clauses.push({ condition: undefined, body: parseStatementBlock() });
          skipNewlines();
          break;
        }
      }
      
      return node;
    }
    
    function parseStatementBlock() {
      accept(T.L_BRACE);
      var statements = parseStatements();
      accept(T.R_BRACE);
      return statements;
    }
    
    function parseWhileStatement() {
      var line = lexer.line();
      accept(T.WHILE);
      var node = { type: 'while', line: line };
      node.condition = parseExpression();
      skipNewlines();
      node.body = parseStatementBlock();
      return node;
    }
    
    function parseLoopStatement() {
      var line = lexer.line();
      accept(T.LOOP);
      var node = { type: 'loop', line: line };
      skipNewlines();
      node.body = parseStatementBlock();
      return node;
    }
    
    function parseExpressionStatement() {
      var node = parseExpression();
      if (atBlockTerminator()) {
        /* do nothing */
      } else if (atStatementTerminator()) {
        next();
      }
      return node;
    }
    
    function parseReturnStatement() {
      var line = lexer.line();
      accept(T.RETURN);
      
      var node = { type: 'return', line: line, returnValue: undefined };
      
      if (atBlockTerminator()) {
        /* do nothing */
      } else if (atStatementTerminator()) {
        next();
      } else {
        node.returnValue = parseExpression();
      }
      
      return node;
    }
    
    function parseStatements() {
      var statements = [];
      
      skipStatementTerminators();
      
      while (curr !== T.EOF && curr !== T.R_BRACE) {
        switch (curr) {
          case T.DEF:
            statements.push(parseFunctionDefinition());
            break;
          case T.IF:
            statements.push(parseIfStatement());
            break;
          case T.WHILE:
            statements.push(parseWhileStatement());
            break;
          case T.LOOP:
            statements.push(parseLoopStatement());
            break;
          case T.RETURN:
            statements.push(parseReturnStatement());
            break;
          default:
            // TODO: if parsed expression is a sole identifier, turn it
            // into a call
            statements.push(parseExpressionStatement());
            break;
        }
        skipStatementTerminators();
      }
      
      return statements;
    }
    
    // non-empty lists only
    function parseExpressionList() {
      var expressions = [];
      expressions.push(parseExpression());
      while (at(T.COMMA)) {
        next();
        expressions.push(parseExpression());
      }
      return expressions;
    }
    
    function parseExpression() {
      return parseAssignExpression();
    }
    
    // foo = "bar"
    function parseAssignExpression() {
      var exp = parseLogicalOrExpression();
      if (at(T.ASSIGN)) {
        var line = lexer.line();
        next();
        var root = { type: 'assign', line: line, left: exp, right: parseLogicalOrExpression() }, curr = root;
        while (at(T.ASSIGN)) {
          line = lexer.line();
          next();
          curr.right = { type: 'assign', line: line, left: curr.right, right: parseLogicalOrExpression() };
          curr = curr.right;
        }
        return root;
      } else {
        return exp;
      }
    }
    
    function parseLogicalOrExpression() {
      var exp = parseLogicalAndExpression();
      while (at(T.LOR)) {
        var line = lexer.line();
        next();
        exp = { type: TOKEN_OP[T.LOR], line: line, left: exp, right: parseLogicalAndExpression() };
      }
      return exp;
    }
    
    function parseLogicalAndExpression() {
      var exp = parseEqualityExpression();
      while (at(T.LAND)) {
        var line = lexer.line();
        next();
        exp = { type: TOKEN_OP[T.LAND], line: line, left: exp, right: parseEqualityExpression() };
      }
      return exp;
    }
    
    function parseEqualityExpression() {
      var exp = parseCmpExpression();
      while (at(T.EQ) || at(T.NEQ)) {
        var line = lexer.line();
        var op = TOKEN_OP[curr];
        next();
        exp = { type: op, line: line, left: exp, right: parseCmpExpression() };
      }
      return exp;
    }
    
    function parseCmpExpression() {
      var exp = parseAddSubExpression();
      while (at(T.LT) || at(T.GT) || at(T.LE) || at(T.GE)) {
        var line = lexer.line();
        var op = TOKEN_OP[curr];
        next();
        exp = { type: op, line: line, left: exp, right: parseAddSubExpression() };
      }
      return exp;
    }
    
    // a + b, a - b
    function parseAddSubExpression() {
      var exp = parseMulDivExpression();
      while (at(T.ADD) || at(T.SUB)) {
        var line = lexer.line();
        var op = TOKEN_OP[curr];
        next();
        exp = { type: op, line: line, left: exp, right: parseMulDivExpression() };
      }
      return exp;
    }
    
    // a * b, a / b
    function parseMulDivExpression() {
      var exp = parseUnary();
      while (at(T.MUL) || at(T.DIV)) {
        var line = lexer.line();
        var op = TOKEN_OP[curr];
        next();
        exp = { type: op, line: line, left: exp, right: parseUnary() };
      }
      return exp;
    }
    
    // !foo, ~foo, -foo, +foo
    function parseUnary() {
      if (at(T.BANG) || at(T.TILDE) || at(T.SUB) || at(T.ADD)) {
        var line = lexer.line();
        var root = { type: TOKEN_OP[curr], line: line, exp: null }, curr = root;
        next();
        while (at(T.BANG) || at(T.TILDE) || at(T.SUB) || at(T.ADD)) {
          line = lexer.line();
          curr.exp = { type: TOKEN_OP[curr], line: line, exp: null };
          curr = curr.exp;
          next();
        }
        curr.exp = parseCall();
        return root;
      } else {
        return parseCall();
      }
    }
    
    // foo(1, 2, 3)
    // foo 1, 2, 3
    // TODO: disallow nested no-paren calls?
    function parseCall() {
      var atom = parseAtom(), line, args = null;
      if (at(T.L_PAREN)) {
        line = lexer.line();
        next();
        if (at(T.R_PAREN)) {
          args = [];
        } else {
          args = parseExpressionList();
        }
        accept(T.R_PAREN);
        return { type: 'call', line: line, fn: atom, args: args };
      } else if (atExpStart()) {
        line = lexer.line();
        var args = parseExpressionList();
        return { type: 'call', line: line, fn: atom, args: args };
      } else {
        return atom;
      }
    }
    
    function parseAtom() {
      var exp = null, line = lexer.line();
      
      if (at(T.TRUE)) {
        exp = true;
        next();
      } else if (at(T.FALSE)) {
        exp = false;
        next();
      } else if (at(T.INTEGER)) {
        exp = parseInt(text(), 10);
        next();
      } else if (at(T.HEX)) {
        exp = parseInt(text(), 16);
        next();
      } else if (at(T.BINARY)) {
        exp = parseInt(text().substring(2), 2);
        next();
      } else if (at(T.FLOAT)) {
        exp = parseFloat(text(), 10);
        next();
      } else if (at(T.STRING)) {
        exp = text();
        next();
      } else if (at(T.COLOR)) {
        exp = decodeColor(text());
        next();
      } else if (at(T.TRACE)) {
        exp = { type: 'trace', line: line };
        next();
      } else if (at(T.IDENT)) {
        exp = { type: 'ident', line: line, name: text() };
        next();
      } else if (at(T.L_PAREN)) {
        next();
        exp = parseExpression();
        accept(T.R_PAREN);
      } else {
        error("expected: expression");
      }
      
      return exp;
    }
    
    function parseTopLevel() {
      var statements = parseStatements();
      accept(T.EOF);
      return statements;
    }
    
    next();
    
    return {
      parseTopLevel        : parseTopLevel
    };
  }
  
})(this, simple);