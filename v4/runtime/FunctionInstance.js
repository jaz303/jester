module.exports = FunctionInstance;

function FunctionInstance(fn, env) {
	this.fn = fn;
	this.env = env;
}

FunctionInstance.prototype.call = function(ctx, env, args, cont, err) {
	// create a new env
	// add in arguments
	// evaluate body
}