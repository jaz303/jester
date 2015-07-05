module.exports = Literal;

function Literal(value) {
	this.value = value;
}

Literal.prototype.type = require('./type')('LITERAL');

Literal.prototype.evaluate = function(ctx, env, cont, err) {
	return ctx.thunk(cont, this.value);
};