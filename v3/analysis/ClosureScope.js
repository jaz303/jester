module.exports = ClosureScope;

require('util').inherits(ClosureScope, require('./Scope'));

function ClosureScope(parentScope) {
	this.parentScope = parentScope;
}