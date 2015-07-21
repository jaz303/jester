module.exports = GlobalDict;

function GlobalDict() {}

GlobalDict.prototype.type = require('./type')('GLOBAL_DICT');

GlobalDict.prototype.evaluate = function(ctx, env, cont, err) {
	try {
		return ctx.thunk(cont, ctx.globals);
	} catch (e) {
		return ctx.thunk(err, e);
	}
};