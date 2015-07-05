module.exports = Yield;

function Yield() {}

Yield.prototype.type = require('./type')('YIELD');

Yield.prototype.evaluate = function(ctx, env, cont, err) {
	return ctx.yield(cont);
};