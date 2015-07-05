module.exports = Call;

function Call(callee, args) {
	this.callee = callee;
	this.args = args;
}

Call.prototype.type = require('./type')('CALL');

Call.prototype.evaluate = function(ctx, env, cont, err) {
	var callee = this.callee;
	return this.evaluateList(ctx, env, this.args, function(args) {
		return callee.evaluate(ctx, env, function(fn) {
			if (typeof fn === 'function') {
				var res = fn.call(null, ctx, args);
				if (res && typeof res.then === 'function') {
					return ctx.wait(res, cont, err);
				} else {
					return ctx.thunk(cont, res);
				}
			} else {
				return ctx.thunk(err, new Error("expression is not callable"));
			}
		}, err);
	}, err);
}

Call.prototype.evaluateList = function(ctx, env, list, cont, err) {
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