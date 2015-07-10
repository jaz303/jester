module.exports = GlobalIdent;

var VOID = require('../runtime/void');

function GlobalIdent(name) {
	this.name = name;
}

GlobalIdent.prototype.type = require('./type')('GLOBAL_IDENT');

GlobalIdent.prototype.evaluate = function(ctx, env, cont, err) {
	try {
		return ctx.thunk(cont, ctx.globals[this.name] || VOID);
	} catch (e) {
		return ctx.thunk(err, e);
	}
};