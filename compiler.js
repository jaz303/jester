;(function(global, simple) {
  
  var ops = simple.opcodes;
  
  var BIN_OPS = {
    '+'   : ops.ADD,
    '-'   : ops.SUB,
    '*'   : ops.MUL,
    '/'   : ops.DIV
  };
  
  function Compiler() {}
  
  Compiler.prototype = {
    emit: function(opcode) {
      this._fn.code.push(opcode);
    },
    
    compileAssign: function(ast) {
      var slot = this._fn.slotForLocal(ast[1][1]);
      this.compileExpression(ast[2]);
      this.emit(ops.SETL | slot);
    },
    
    compileCall: function(ast) {
      
      var args = ast[2];
      
      if (args.length > 255) {
        throw "compile error - max args per function call (255) exceeded";
      }
      
      for (var i = 0; i < args.length; ++i) {
        this.compileExpression(args[i]);
      }
      
      this.emit(ops.CALL | (args.length << 16) | this._fn.slotForFunctionCall(ast[1][1]));
      
    },
    
    compileExpression: function(ast) {
      if (ast === true) {
        this.emit(ops.PUSHT);
      } else if (ast === false) {
        this.emit(ops.PUSHF);
      } else if (typeof ast == 'number' || typeof ast == 'string') {
        this.emit(ops.PUSHC | this._fn.slotForConstant(ast));
      } else {
        switch (ast[0]) {
          case 'trace':
            this.emit(ops.TRACE);
            break;
          case 'ident':
            this.emit(ops.PUSHL | this._fn.slotForLocal(ast[1]));
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
          case 'assign':
            this.compileAssign(ast);
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
    
    compileFunctionBody: function(ast) {
      for (var i = 0; i < ast.length; ++i) {
        this.compileStatement(ast[i]);
      }
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