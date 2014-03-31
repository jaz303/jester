module.exports = Compiler;

var Module 		= require('./internals/Module'),
	Precompiler	= require('./Precompiler'),
	A 			= require('./ast_nodes');

function expectNodeType(ast, type) {
	if (ast.type !== type) {
		throw new Error("AST node type mismatch, got " + ast.type, "expected " + type);
	}
}

function Compiler(context) {
	this._context = context;
}

Compiler.prototype._compileModule = function(mod) {
	console.log("compiling: ", mod);
}

Compiler.prototype.compileModule = function(mod, cb) {

	expectNodeType(mod, A.MODULE);

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
