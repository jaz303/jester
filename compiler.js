;(function(global, simple) {
  
  var ops = simple.opcodes;
  
  var BIN_OPS = {
    '+'   : ops.ADD,
    '-'   : ops.SUB,
    '*'   : ops.MUL,
    '/'   : ops.DIV,
    '<'   : ops.LT,
    '<='  : ops.LE,
    '>'   : ops.GT,
    '>='  : ops.GE
  };
  
  function Compiler(env) {
    this._env = env;
    this._fn = null;
  }
  
  Compiler.prototype = {
    emit: function(opcode) {
      this._fn.code.push(opcode);
    },
    
    compileFnDef: function(ast) {
      
      var oldFn = this._fn;
      var newFn = new simple.Fn();
      
      this._fn = newFn;
      
      var params = ast[2];
      for (var i = 0; i < params.length; ++i) {
        newFn.slotForLocal(params[i]);
        newFn.minArgs++;
        newFn.maxArgs++;
      }
      
      this.compileFunctionBody(ast[3]);
      
      this._env[ast[1]] = newFn;
      
      this._fn = oldFn;
      
      return newFn;
      
    },
    
    compileAssign: function(ast) {
      var slot = this._fn.slotForLocal(ast[1][1]);
      this.compileExpression(ast[2]);
      this.emit(ops.SETL | (slot << 8));
    },
    
    compileIf: function(ast) {
      
      var ix        = 1,
          firstAbs  = null,
          lastAbs   = null;
      
      while (ix < ast.length) {
        if (ast[ix]) {
          
          this.compileExpression(ast[ix]);
          
          var failJump = this._fn.code.length;
          this.emit(ops.JMPF);
          
          this.compileStatements(ast[ix + 1]);
          
          if (firstAbs === null) {
            firstAbs = this._fn.code.length;
            lastAbs = this._fn.code.length;
            this.emit(0);
          } else {
            var tmp = this._fn.code.length;
            this.emit(lastAbs); // hack - stash pointer to last jump point so we can backtrack
            lastAbs = tmp;
          }
          
          this._fn.code[failJump] = ops.JMPF | ((this._fn.code.length - failJump - 1) << 8);
        
        } else {
          this.compileStatements(ast[ix + 1]);
        }
        ix += 2;
      }
      
      var jmpOp   = ops.JMPA | (this._fn.code.length << 8),
          currAbs = lastAbs;
      
      do {
        var tmp = this._fn.code[currAbs];
        this._fn.code[currAbs] = jmpOp;
        if (currAbs == firstAbs) {
          break;
        } else {
          currAbs = tmp;
        }
      } while (true);
      
    },
    
    compileWhile: function(ast) {
      
      var loopStart = this._fn.code.length;
      this.compileExpression(ast[1]);
      
      var failJump = this._fn.code.length;
      this.emit(ops.JMPF);
      
      this.compileStatements(ast[2]);
      this.emit(ops.JMPA | (loopStart << 8));
      
      this._fn.code[failJump] = ops.JMPF | ((this._fn.code.length - failJump - 1) << 8);

    },
    
    compileReturn: function(ast) {
      if (ast.length == 2) {
        this.compileExpression(ast[1]);
      } else {
        this.emit(ops.PUSHF); // TODO: should probably push undefined/null or whatever
      }
      this.emit(ops.RET);
    },
    
    compileYield: function(ast) {
      this.emit(ops.YIELD);
    },
    
    compileCall: function(ast) {
      
      var args = ast[2];
      
      if (args.length > 255) {
        throw "compile error - max args per function call (255) exceeded";
      }
      
      for (var i = 0; i < args.length; ++i) {
        this.compileExpression(args[i]);
      }
      
      this.emit(ops.CALL | (args.length << 8) | (this._fn.slotForFunctionCall(ast[1][1]) << 16));
      
    },
    
    compileExpression: function(ast) {
      if (ast === true) {
        this.emit(ops.PUSHT);
      } else if (ast === false) {
        this.emit(ops.PUSHF);
      } else if (typeof ast == 'number' || typeof ast == 'string') {
        this.emit(ops.PUSHC | (this._fn.slotForConstant(ast) << 8));
      } else {
        switch (ast[0]) {
          case 'trace':
            this.emit(ops.TRACE);
            break;
          case 'ident':
            this.emit(ops.PUSHL | (this._fn.slotForLocal(ast[1]) << 8));
            break;
          case 'call':
            this.compileCall(ast);
            break;
          default:
            if (ast[0] in BIN_OPS) {
              this.compileExpression(ast[1]);
              this.compileExpression(ast[2]);
              this.emit(BIN_OPS[ast[0]]);
            } else {
              throw "unknown expression - " + ast;
            }
            break;
        }
      }
    },
    
    compileStatement: function(ast) {
      if (Array.isArray(ast)) {
        switch (ast[0]) {
          case 'def':
            this.compileFnDef(ast);
            break;
          case 'assign':
            this.compileAssign(ast);
            break;
          case 'if':
            this.compileIf(ast);
            break;
          case 'while':
            this.compileWhile(ast);
            break;
          case 'return':
            this.compileReturn(ast);
            break;
          case 'yield':
            this.compileYield(ast);
            break;
          default:
            this.compileExpression(ast);
            this.emit(ops.POP);
            break;
        }
      } else {
        this.compileExpression(ast);
        this.emit(ops.POP);
      }
    },
    
    compileStatements: function(ast) {
      for (var i = 0; i < ast.length; ++i) {
        this.compileStatement(ast[i]);
      }
    },
    
    compileFunctionBody: function(ast) {
      this.compileStatements(ast);
      this.emit(ops.PUSHF);
      this.emit(ops.RET);
    },
    
    compile: function(ast) {
      this._fn = new simple.Fn();
      this.compileFunctionBody(ast);
      return this._fn;
    }
  };
  
  simple.Compiler = Compiler;
  
})(this, simple);