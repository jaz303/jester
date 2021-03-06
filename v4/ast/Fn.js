module.exports = Fn;

function Fn(name, params, body) {
	this.name = name;
	this.params = params;
	this.body = body;
	this.scope = null;
}

Fn.prototype.type = require('./type')('FN');

// FIXME: this is a total hack, Fns should really be removed from
// the AST by a post-processing step (or just return a null in the
// parser)
Fn.prototype.evaluate = function(ctx, env, cont, err) {
	return ctx.thunk(cont);
}

Fn.prototype.createCodeObject = function() {
	return this;
}