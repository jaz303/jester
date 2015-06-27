module.exports = If;

function If(condition, consequent, alternate) {
	this.condition = condition;
	this.consequent = consequent;
	this.alternate = alternate;
}

If.prototype.evaluate = function(ctx, env, cont, err) {
	var consequent = this.consequent;
	var alternate = this.alternate;
	return this.condition.evaluate(ctx, env, function(res) {
		if (ctx.isTruthy(res)) {
			return consequent.evaluate(ctx, env, cont, err);
		} else if (alternate) {
			return alternate.evaluate(ctx, env, cont, err);
		} else {
			return ctx.thunk(cont, null);
		}
	}, err);
}