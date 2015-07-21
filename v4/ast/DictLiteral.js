module.exports = DictLiteral;

var Dict = require('../runtime/Dict');

function DictLiteral(keys, values) {
	this.keys = keys;
	this.values = values;
}

DictLiteral.prototype.type = require('./type')('DICT_LITERAL');

DictLiteral.prototype.evaluate = function(ctx, env, cont, err) {
	var out = new Dict(), keys = this.keys, vals = this.values, len = keys.length;
	var items = out.items;
	return (function _next(ix) {
		if (ix === len) {
			return ctx.thunk(cont, out);
		} else {
			return vals[ix].evaluate(ctx, env, function(res) {
				items[keys[ix]] = res;
				return _next(ix + 1);
			}, err);
		}
	})(0);
}