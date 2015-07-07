module.exports = Return;

function Return(value) {
	this.value = value;
}

Return.prototype.type = require('./type')('RETURN');

Return.prototype.evaluate = function(ctx, env, cont, err) {
	return this.value.evaluate(ctx, env, function(value) {
		return ctx.thunk(err, value);
	}, err);
}