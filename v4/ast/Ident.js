module.exports = Ident;

var get = require('../env').get;

function Ident(name) {
	this.name = name;
}

Ident.prototype.evaluate = function(ctx, env, cont, err) {
	try {
		return ctx.thunk(cont, get(env, this.name));
	} catch (e) {
		return ctx.thunk(err, e);
	}
};