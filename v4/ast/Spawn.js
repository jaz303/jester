module.exports = Spawn;

function Spawn(callee, args) {
	this.callee = callee;
	this.args = args;
}

Spawn.prototype.evaluate = function(ctx, env, cont, err) {
	var callee = this.callee;
	this.evaluateArgs(ctx, env, this.args, function(err, args) {
		if (err) return cb(err);
		callee.evaluate(ctx, env, function(err, fn) {
			if (err) return cb(err);
			cb(null, ctx.spawn(fn, args));
		});
	});
}
