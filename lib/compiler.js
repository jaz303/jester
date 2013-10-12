"use strict";

var T               = require('./tokens').tokens,
    A               = require('./ast_nodes'),
    ops             = require('./opcodes'),
    makeFunction    = require('./types').makeFunction,
    makeColor       = require('./types').makeColor;

function assert(condition, message) {
    if (!condition) throw (message || "assertion failed");
}

var BIN_OPS = {};
BIN_OPS[T.ADD]  = ops.ADD;
BIN_OPS[T.SUB]  = ops.SUB;
BIN_OPS[T.MUL]  = ops.MUL;
BIN_OPS[T.DIV]  = ops.DIV;
BIN_OPS[T.LT]   = ops.LT;
BIN_OPS[T.LE]   = ops.LE;
BIN_OPS[T.GT]   = ops.GT;
BIN_OPS[T.GE]   = ops.GE;
BIN_OPS[T.EQ]   = ops.EQ;
BIN_OPS[T.NEQ]  = ops.NEQ;

function Compiler() {
    this._fn = null;
}

Compiler.prototype = {
    emit: function(opcode, line) {
        this._fn.code.push(opcode);
        this._fn.sourceMap.push(line || 0);
    },
    
    compileFnDef: function(ast) {
        
        var oldFn = this._fn;
        var newFn = makeFunction();
        
        newFn.name = ast.name;
        
        this._fn = newFn;
        
        var params = ast.parameters;
        for (var i = 0; i < params.length; ++i) {
            newFn.slotForLocal(params[i]);
            newFn.minArgs++;
            newFn.maxArgs++;
        }
        
        this.compileFunctionBody(ast.body);
        
        this._env[ast.name] = newFn;
        
        this._fn = oldFn;
        
        return newFn;
        
    },
    
    compileAssign: function(ast) {

        if (ast.left.type === A.IDENT) {

            var slot = this._fn.slotForLocal(ast.left.name);
            this.compileExpression(ast.right);
            this.emit(ops.SETL | (slot << 8), ast.line);
        
        } else if (ast.left.type === A.GLOBAL_IDENT) {

            var slot = this._fn.slotForName(ast.left.name);
            this.compileExpression(ast.right);
            this.emit(ops.SETG | (slot << 16), ast.line);

        } else {

            throw "compile error: invalid left hand in assignment";

        }

    },
    
    compileIf: function(ast) {
        
        var ix        = 0,
                firstAbs  = null,
                lastAbs   = null,
                clauses   = ast.clauses;
        
        while (ix < clauses.length) {
            var clause = clauses[ix];
            
            if (typeof clause.condition !== 'undefined') {
                this.compileExpression(clause.condition);
                
                var failJump = this._fn.code.length;
                this.emit(ops.JMPF);
                
                this.compileStatements(clause.body);
                
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
                this.compileStatements(clause.body);
            }
            
            ix++;
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
        this.compileExpression(ast.condition);
        
        var failJump = this._fn.code.length;
        this.emit(ops.JMPF);
        
        this.compileStatements(ast.body);
        this.emit(ops.JMPA | (loopStart << 8));
        
        this._fn.code[failJump] = ops.JMPF | ((this._fn.code.length - failJump - 1) << 8);

    },
    
    compileLoop: function(ast) {
        var loopStart = this._fn.code.length;
        this.compileStatements(ast.body);
        this.emit(ops.YIELD, ast.line);
        this.emit(ops.JMPA | (loopStart << 8));
    },
    
    compileReturn: function(ast) {
        
        if (typeof ast.returnValue !== 'undefined') {
            this.compileExpression(ast.returnValue);
        } else {
            this.emit(ops.PUSHF); // TODO: should probably push undefined/null or whatever
        }
        
        this.emit(ops.RET, ast.line);
    
    },
    
    compileYield: function(ast) {
        this.emit(ops.YIELD, ast.line);
    },
    
    compileCall: function(ast) {
        
        var args = ast.args;
        if (args.length > 255) {
            throw "compile error - max args per function call (255) exceeded";
        }
        
        for (var i = 0; i < args.length; ++i) {
            this.compileExpression(args[i]);
        }
        
        this.emit(ops.CALL | (args.length << 8) | (this._fn.slotForFunctionCall(ast.fn.name) << 16), ast.line);
        
    },

    compileSpawn: function(ast) {

        var args = ast.args;
        if (args.length > 255) {
            throw "compile error - max args per spawn (255) exceeded";
        }

        for (var i = 0; i < args.length; ++i) {
            this.compileExpression(args[i]);
        }

        this.emit(ops.SPAWN | (args.length << 8) | (this._fn.slotForFunctionCall(ast.fn.name) << 16), ast.line);

    },

    compileEval: function(ast) {

        this.compileExpression(ast.code);

        this.emit(ops.EVAL, ast.line);

    },
    
    compileLogicalAnd: function(ast) {
        
        this.compileExpression(ast.left);
        
        var bailJump = this._fn.code.length;
        this.emit(0);
        
        this.compileExpression(ast.right);
        
        this._fn.code[bailJump] = ops.JMPF_OP | ((this._fn.code.length - bailJump - 1) << 8);

    },
    
    compileLogicalOr: function(ast) {
        
        this.compileExpression(ast.left);
        
        var bailJump = this._fn.code.length;
        this.emit(0);
        
        this.compileExpression(ast.right);
        
        this._fn.code[bailJump] = ops.JMPT_OP | ((this._fn.code.length - bailJump - 1) << 8);
        
    },
    
    compileExpression: function(ast) {
        // FIXME: ast.line will be undefined for true and false. Is this intentional?
        if (ast === true) {
            this.emit(ops.PUSHT, ast.line);
        } else if (ast === false) {
            this.emit(ops.PUSHF, ast.line);
        } else if (typeof ast == 'number' || typeof ast == 'string') {
            this.emit(ops.PUSHC | (this._fn.slotForConstant(ast) << 8), ast.line);
        } else {
            switch (ast.type) {
                case A.COLOR:
                    var color = makeColor(ast.r, ast.g, ast.b, ast.a);
                    this.emit(ops.PUSHC | (this._fn.slotForConstant(color) << 8), ast.line);
                    break;
                case A.ASSIGN:
                    this.compileAssign(ast);
                    break;
                case A.TRACE:
                    this.emit(ops.TRACE, ast.line);
                    break;
                case A.IDENT:
                    this.emit(ops.PUSHL | (this._fn.slotForLocal(ast.name) << 8), ast.line);
                    break;
                case A.GLOBAL_IDENT:
                    this.emit(ops.PUSHG | (this._fn.slotForName(ast.name) << 16), ast.line);
                    break;
                case A.CALL:
                    this.compileCall(ast);
                    break;
                case A.BIN_OP:
                    if (ast.op === T.LAND) {
                        this.compileLogicalAnd(ast);
                    } else if (ast.op === T.LOR) {
                        this.compileLogicalOr(ast);
                    } else if (ast.op in BIN_OPS) {
                        this.compileExpression(ast.left);
                        this.compileExpression(ast.right);
                        this.emit(BIN_OPS[ast.op], ast.line);
                    } else {
                        throw "unknown binary operator!";
                    }
                    break;
                case A.SPAWN:
                    this.compileSpawn(ast);
                    break;
                case A.EVAL:
                    this.compileEval(ast);
                    break;
                case A.NULL:
                    this.emit(ops.PUSHN, ast.line);
                    break;
                default:
                    throw "unknown/unimplemented AST node type: " + ast.type;
            }
        }
    },
    
    compileStatement: function(ast) {
        if (ast.type) {
            switch (ast.type) {
                case A.DEF:
                    this.compileFnDef(ast);
                    break;
                case A.IF:
                    this.compileIf(ast);
                    break;
                case A.WHILE:
                    this.compileWhile(ast);
                    break;
                case A.LOOP:
                    this.compileLoop(ast);
                    break;
                case A.RETURN:
                    this.compileReturn(ast);
                    break;
                case A.YIELD:
                    this.compileYield(ast);
                    break;
                default:
                    this.compileExpression(ast);
                    this.emit(ops.SETZ);
                    break;
                }
        } else {
            this.compileExpression(ast);
            this.emit(ops.SETZ);
        }
    },
    
    compileStatements: function(statements) {
        for (var i = 0; i < statements.length; ++i) {
            this.compileStatement(statements[i]);
        }
    },
    
    compileFunctionBody: function(statements) {
        this.compileStatements(statements);
        this.emit(ops.PUSHZ);
        this.emit(ops.RET);
    },
    
    compile: function(ast) {
        this._env = {};
        this._fn = makeFunction();
        
        this.compileFunctionBody(ast);
        
        return {
            topLevelFn  : this._fn,
            symbols     : this._env
        };
    },

    compileForEval: function(ast, fn) {

        this._env = {};
        this._fn = fn;

        var code = fn.code;
        this._fn.code = [];

        this.compileStatements(ast);
        this.emit(ops.PUSHZ);

        var retVal = {
            code        : this._fn.code,
            symbols     : this._env
        };

        this._fn.code = code;

        return retVal;
    }
};

exports.createCompiler = function() {
    return new Compiler();
}
