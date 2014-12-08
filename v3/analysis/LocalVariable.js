module.exports = LocalVariable;

function LocalVariable(scope, name) {
	this.definingScope = scope;
	this.name = name;
}

LocalVariable.prototype.isFunctionDefinition = function() {
	return false;
}