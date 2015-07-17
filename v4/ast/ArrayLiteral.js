module.exports = ArrayLiteral;

var Ary = require('../runtime/array');

function ArrayLiteral(elements) {
	this.elements = elements;
}

ArrayLiteral.prototype.type = require('./type')('ARRAY_LITERAL');

ArrayLiteral.prototype.evaluate = function(ctx, env, cont, err) {
	var out = new Ary(), els = this.elements, len = els.length;
	var items = out.items;
	return (function _next(ix) {
		if (ix === len) {
			return ctx.thunk(cont, out);
		} else {
			return els[ix].evaluate(ctx, env, function(res) {
				items.push(res);
				return _next(ix + 1);
			}, err);
		}
	})(0);
}