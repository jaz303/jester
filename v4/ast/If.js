module.exports = If;

var VOID = require('../runtime/void');

function If(conditions, bodies) {
	this.conditions = conditions;
	this.bodies = bodies;
}

If.prototype.type = require('./type')('IF');

If.prototype.evaluate = function(ctx, env, cont, err) {
	var conditions = this.conditions;
	var bodies = this.bodies;
	var len = conditions.length;
	return (function _loop(ix) {
		if (ix === len) {
			return ctx.thunk(cont, VOID);
		} else if (!conditions[ix]) {
			return bodies[ix].evaluate(ctx, env, function(res) {
				return ctx.thunk(cont, res);
			}, err);
		} else {
			return conditions[ix].evaluate(ctx, env, function(res) {
				if (ctx.isTruthy(res)) {
					return bodies[ix].evaluate(ctx, env, function(res) {
						return ctx.thunk(cont, res);
					}, err);
				} else {
					return _loop(ix + 1);
				}
			}, err);
		}
	})(0);
}