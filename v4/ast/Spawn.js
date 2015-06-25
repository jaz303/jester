module.exports = Spawn;

function Spawn(callee, args) {
	this.callee = callee;
	this.args = args;
}

Spawn.prototype.evaluate = function(ctx, env, cont, err) {
	var callee = this.callee;
	return this.evaluateArgs(ctx, env, this.args, function(args) {
		return callee.evaluate(ctx, env, function(fn) {
			try {
				return ctx.thunk(cont, ctx.spawn(fn, args));
			} catch (error) {
				return ctx.thunk(err, error);
			}
		}, err);
	}, err);
}
