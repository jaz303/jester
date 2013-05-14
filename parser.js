;(function(global, simple) {
  
  simple.createParser = function(lexer) {
    
    function at(token) {
      return curr === token;
    }
    
    function atBlockTerminator() {
      return curr === T_R_BRACE;
    }

    function atStatementTerminator() {
      return curr === T_SEMICOLON || curr === T_NEWLINE;
    }
    
    function parseFormalParameterList() {
      var params = [];
      
      if (!at(T_IDENT)) {
        return params;
      }
      
      params.push(text());
      accept();
      
      while (at(T_COMMA)) {
        accept();
        if (!at(T_IDENT)) {
          throw("expected: parameter name (identifier)");
        } else {
          params.push(text());
          accept();
        }
      }
      
      return params;
    }
    
    function parseFunctionDefinition() {
      accept(T_DEF);
      
      var node = {type: 'def'};
      
      if (!at(T_IDENT)) {
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
      accept(T_IF);
      var node = {type: 'if', clauses: []};
      
      node.clauses.push({
        condition   : parseExpression(),
        body        : parseStatementBlock()
      });
      
      while (at(T_ELSE)) {
        accept();
        if (at(T_IF)) {
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
      accept(T_L_BRACE);
      var statements = parseStatements();
      accept(T_R_BRACE);
      return statements;
    }
    
    function parseWhileStatement() {
      accept(T_WHILE);
      var node = {type: 'while'};
      node.condition = parseExpression();
      node.body = parseStatementBlock();
      return node;
    }
    
    function parseExpressionStatement() {
      var node = parseExpression();
      if (atBlockTerminator()) {
        /* do nothing */
      } else if (atStatementTerminator()) {
        accept();
      }
      return node;
    }
    
    function parseReturnStatement() {
      accept(T_RETURN);
      
      var node = {type: 'return', returnValue: null};
      
      if (atBlockTerminator()) {
        /* do nothing */
      } else if (atStatementTerminator()) {
        accept();
      } else {
        node.returnValue = parseExpression();
      }
      
      return node;
    }
    
    function parseStatements() {
      var node = {type: 'statements', statements: []};
      
      while (curr !== T_EOF && curr !== T_R_BRACE) {
        switch (curr) {
          case T_DEF:
            node.statements.push(parseFunctionDefinition());
            break;
          case T_IF:
            node.statements.push(parseIfStatement());
            break;
          case T_WHILE:
            node.statements.push(parseWhileStatement());
            break;
          default:
            node.statements.push(parseExpressionStatement());
            break;
        }
      }
      
      return node;
    }
    
    function parseExpression() {
      
    }
    
    function parseTopLevel() {
      var statements = parseStatements();
      accept(T_EOF);
      return statements;
    }
    
    return {
      parseTopLevel        : parseTopLevel
    };
  }
  
})(this, simple);