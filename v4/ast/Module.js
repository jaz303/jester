module.exports = Module;

function Module(block) {
	this.statements = block;
	this.scope = null;
}

Module.prototype.type = require('./type')('MODULE');

Module.prototype.evaluate = function(ctx, env, cont, err) {
	return this.statements.evaluate(ctx, env, cont, err);
}