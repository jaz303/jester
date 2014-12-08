module.exports = Scope;

function Scope() {}

Scope.prototype.addLocalVariable = function(name) {
	console.log("local variable: " + name);
}

Scope.prototype.addFunctionDefinition = function(name, ast) {
	console.log("function defined: " + name);
}

Scope.prototype.symbolAssigned = function(name) {
	console.log("symbol assigned: " + name);
}