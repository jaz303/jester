module.exports = Yield;

function Yield() {}

Yield.prototype.evaluate = function(ctx, env, cont, err) {
	return ctx.yield(cont);
};