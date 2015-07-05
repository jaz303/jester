module.exports = Spawn;

function Spawn(callee, args) {
	this.callee = callee;
	this.args = args;
}

Spawn.prototype.type = require('./type')('SPAWN');

Spawn.prototype.evaluate = function(ctx, env, cont, err) {
	var callee = this.callee;
	return this.evaluateList(ctx, env, this.args, function(args) {
		return callee.evaluate(ctx, env, function(fn) {
			try {
				return ctx.thunk(cont, ctx.spawn(env, fn, args));
			} catch (error) {
				return ctx.thunk(err, error);
			}
		}, err);
	}, err);
}

Spawn.prototype.evaluateList = function(ctx, env, list, cont, err) {
	var out = [];
	var length = list.length;
	return (function _next(ix) {
		if (ix === length) return ctx.thunk(cont, out);
		return list[ix].evaluate(ctx, env, function(value) {
			out.push(value);
			return _next(ix+1);
		}, err);
	})(0);
}