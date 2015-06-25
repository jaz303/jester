module.exports = Module;

function Module(block) {
	this.block = block;
}

Module.prototype.evaluate = function(ctx, env, cont, err) {
	return this.block.evaluate(ctx, env, cont, err);
}