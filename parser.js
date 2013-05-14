;(function(global, simple) {
  
  var T = simple.TOKENS;
  
  var TOKEN_OP = {
    T.SUB     : '-',
    T.ADD     : '+',
    T.MUL     : '*',
    T.DIV     : '/',
    T.BANG    : '!',
    T.TILDE   : '~',
    T.LT      : '<',
    T.GT      : '>',
    T.LE      : '<=',
    T.GE      : '>=',
    T.EQ      : '==',
    T.NEQ     : '!='
  };
  
  // these are the tokens that can follow an identifier to allow
  // a function call without parens e.g.
  // foo 1, 2, 3
  var EXP_START_TOKENS = {
    T.SUB       : true,
    T.ADD       : true,
    T.BANG      : true,
    T.TILDE     : true,
    T.TRUE      : true,
    T.FALSE     : true,
    T.INTEGER   : true,
    T.FLOAT     : true,
    T.STRING    : true,
    T.TRACE     : true,
    T.IDENT     : true
  };
  
  simple.createParser = function(lexer) {
    
    function next() {
      // get next token from lexer and assign to curr
    }
    
    function text() {
      // return current token text
    }
    
    function accept(token, msg) {
      if (curr !== token) {
        throw msg || "unexpted token :(";
      } else {
        next();
      }
    }
    
    function at(token) {
      return curr === token;
    }
    
    function atBlockTerminator() {
      return curr === T.R_BRACE;
    }

    function atStatementTerminator() {
      return curr === T.SEMICOLON || curr === T.NEWLINE;
    }
    
    function atExpStart() {
      return !!EXP_START_TOKENS[curr];
    }
    
    function parseFormalParameterList() {
      var params = [];
      
      if (!at(T.IDENT)) {
        return params;
      }
      
      params.push(text());
      next();
      
      while (at(T.COMMA)) {
        next();
        if (!at(T.IDENT)) {
          throw("expected: parameter name (identifier)");
        } else {
          params.push(text());
          next();
        }
      }
      
      return params;
    }
    
    function parseFunctionDefinition() {
      accept(T.DEF);
      
      var node = { type: 'def' };
      
      if (!at(T.IDENT)) {
        error("expected: function name (identifier)");
      }
      
      node.name = text();
      
      accept(L_PAREN);
      node.parameters = parseFormalParameterList();
      accept(R_PAREN);
      
      node.body = parseStatementBlock();
      
      return node;
    }
    
    function parseIfStatement() {
      accept(T.IF);
      var node = { type: 'if', clauses: [] };
      
      node.clauses.push({
        condition   : parseExpression(),
        body        : parseStatementBlock()
      });
      
      while (at(T.ELSE)) {
        next();
        if (at(T.IF)) {
          node.clauses.push({
            condition   : parseExpression(),
            body        : parseStatementBlock()
          });
        } else {
          node.clauses.push({
            condition   : null,
            body        : parseStatementBlock()
          });
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
      accept(T.WHILE);
      var node = { type: 'while' };
      node.condition = parseExpression();
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
      accept(T.RETURN);
      
      var node = { type: 'return', returnValue: null };
      
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
      var node = { type: 'statements', statements: [] };
      
      while (curr !== T.EOF && curr !== T.R_BRACE) {
        switch (curr) {
          case T.DEF:
            node.statements.push(parseFunctionDefinition());
            break;
          case T.IF:
            node.statements.push(parseIfStatement());
            break;
          case T.WHILE:
            node.statements.push(parseWhileStatement());
            break;
          case T.RETURN:
            node.statements.push(parseReturnStatement());
            break;
          default:
            // TODO: if parsed expression is a sole identifier, turn it
            // into a call
            node.statements.push(parseExpressionStatement());
            break;
        }
      }
      
      return node;
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
      var exp = parseEqualityExpression();
      if (at(T.ASSIGN)) {
        next();
        var root = { type: 'assign', left: exp, right: parseEqualityExpression() }, curr = root;
        while (at(T.ASSIGN)) {
          next();
          curr.right = { type: 'assign', left: curr.right, right: parseEqualityExpression() };
          curr = curr.right;
        }
        return root;
      } else {
        return exp;
      }
    }
    
    function parseEqualityExpression() {
      var exp = parseCmpExpression();
      while (at(T.EQ) || at(T.NEQ)) {
        var op = TOKEN_OP[curr];
        next();
        exp = { type: op, left: exp, right: parseCmpExpression() };
      }
      return exp;
    }
    
    function parseCmpExpression() {
      var exp = parseAddSubExpression();
      while (at(T.LT) || at(T.GT) || at(T.LE) || at(T.GE)) {
        var op = TOKEN_OP[curr];
        next();
        exp = { type: op, left: exp, right: parseAddSubExpression() };
      }
      return exp;
    }
    
    // a + b, a - b
    function parseAddSubExpression() {
      var exp = parseMulDivExpression();
      while (at(T.ADD) || at(T.SUB)) {
        var op = TOKEN_OP[curr];
        next();
        exp = { type: op, left: exp, right: parseMulDivExpression() };
      }
      return exp;
    }
    
    // a * b, a / b
    function parseMulDivExpression() {
      var exp = parseUnary();
      while (at(T.MUL) || at(T.DIV)) {
        var op = TOKEN_OP[curr];
        next();
        exp = { type: op, left: exp, right: parseUnary() };
      }
      return exp;
    }
    
    // !foo, ~foo, -foo, +foo
    function parseUnary() {
      if (at(T.BANG) || at(T.TILDE) || at(T.SUB) || at(T.ADD)) {
        var root = { type: TOKEN_OP[curr], exp: null }, curr = root;
        next();
        while (at(T.BANG) || at(T.TILDE) || at(T.SUB) || at(T.ADD)) {
          curr.exp = { type: TOKEN_OP[curr], exp: null };
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
    function parseCall() {
      var atom = parseAtom(), args = null;
      if (at(T.L_PAREN)) {
        next();
        if (at(T.R_PAREN)) {
          args = [];
        } else {
          args = parseExpressionList();
        }
        accept(T.R_PAREN);
        return { type: 'call', fn: atom, args: args };
      } else if (atExpStart()) {
        var args = parseExpressionList();
        return { type: 'call', fn: atom, args: args };
      } else {
        return atom;
      }
    }
    
    function parseAtom() {
      var exp = null;
      
      if (at(T.TRUE)) {
        exp = true;
        next();
      } else if (at(T.FALSE)) {
        exp = false;
        next();
      } else if (at(T.INTEGER)) {
        exp = parseInt(text(), 10);
        next();
      } else if (at(T.FLOAT)) {
        exp = parseFloat(text(), 10);
        next();
      } else if (at(T.STRING)) {
        exp = text();
        next();
      } else if (at(T.TRACE)) {
        exp = { type: 'trace' };
        next();
      } else if (at(T.IDENT)) {
        exp = { type: 'ident', name: text() };
        next();
      } else if (at(T.L_PAREN)) {
        next();
        exp = parseExpression();
        accept(T.R_PAREN);
      }
      
      return exp;
    }
    
    function parseTopLevel() {
      var statements = parseStatements();
      accept(T.EOF);
      return statements;
    }
    
    return {
      parseTopLevel        : parseTopLevel
    };
  }
  
})(this, simple);