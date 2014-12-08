module.exports = ModuleScope;

require('util').inherits(ModuleScope, require('./Scope'));

var FunctionDefinition 	= require('./FunctionDefinition');
var LocalVariable 		= require('./LocalVariable');

function ModuleScope() {
	this.symbols = {};
}

// ModuleScope.prototype.addImplicitLocalVariable = function(name) {
// 	if (name in this.symbols && this.symbols[name].isFunctionDefinition()) {
// 		throw new Error("cannot assign '" + name "', symbol is already assigned as immutable function");
// 	}
// 	this.symbols[name] = new LocalVariable(this, name);
// }

// ModuleScope.prototype.addFunctionDefinition = function(name, ast) {
// 	if (name in this.symbols) {
// 		throw new Error("duplicate symbol at module scope: " + name);
// 	}
// 	this.symbols[name] = new FunctionDefinition(this, name, ast);
// }