module.exports = FunctionDefinition;

function FunctionDefinition(scope, name, ast) {
	this.definingScope = scope;
	this.name = name;
	this.ast = ast;
}

FunctionDefinition.prototype.isFunctionDefinition = function() {
	return true;
}