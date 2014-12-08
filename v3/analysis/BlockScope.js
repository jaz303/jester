module.exports = BlockScope;

require('util').inherits(BlockScope, require('./Scope'));

function BlockScope(parentScope) {
	this.parentScope = parentScope;
}