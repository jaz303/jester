module.exports = Lambda;

var FunctionInstance = require('../runtime/FunctionInstance');

function Lambda(params, body) {
	this.params = params;
	this.body = body;
	this.scope = null;
}

Lambda.prototype.type = require('./type')('LAMBDA');

Lambda.prototype.evaluate = function(ctx, env, cont, err) {
	return ctx.thunk(cont, new FunctionInstance(this.createCodeObject(), env));
}

Lambda.prototype.createCodeObject = function() {
	return this;
}