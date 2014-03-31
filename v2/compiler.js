module.exports = Compiler;

var Module      = require('./internals/Module'),
    Precompiler = require('./Precompiler'),
    A           = require('./ast_nodes');

function makeAstTypeMismatchError(actual, expected) {
    return new Error("AST node type mismatch, got " + actual + ", expected " + expected);
}

function expectNodeType(ast, type) {
    if (ast.type !== type) {
        throw makeAstTypeMismatchError(ast.type, type);
    }
}

function Compiler(context) {
    this._context = context;
}

Compiler.prototype._compileModule = function(mod) {
    console.log("compiling: ", mod);
}

Compiler.prototype.compileModule = function(mod, cb) {

    if (mod.type !== A.MODULE) {
        cb(makeAstTypeMismatchError(mod.type, A.MODULE));
        return;
    }

    var self = this;

    var pre = new Precompiler(this._context);
    pre.precompile(mod, function(err, loadOrder) {
        if (err) {
            cb(err);
        } else {
            try {
                for (var i = 0; i < loadOrder.length; ++i) {
                    self._compileModule(loadOrder[i]);
                }
                cb(null, loadOrder);
            } catch (e) {
                cb(err);
            }
        }
    });

}
