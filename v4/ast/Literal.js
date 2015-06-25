module.exports = Literal;

function Literal(value) {
	this.value = value;
}

Literal.prototype.evaluate = function(ctx, env, cont, err) {
	return ctx.thunk(cont, this.value);
};