module.exports = FunctionInstance;

function FunctionInstance(co, env) {
	this.__jtype = 'function';
	this.co = co;
	this.env = env;
}
