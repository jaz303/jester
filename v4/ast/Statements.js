module.exports = Statements;

var VOID = require('../runtime/void');

function Statements(statements) {
	this.statements = statements;
}

Statements.prototype.type = require('./type')('STATEMENTS');

Statements.prototype.evaluate = function(ctx, env, cont, err) {
	var stmts = this.statements;
	var length = stmts.length;
	return (function _next(ix, lastValue) {
		if (ix === length) {
			return ctx.thunk(cont, lastValue);
		} else {
			return stmts[ix].evaluate(ctx, env, function(res) {
				return _next(ix+1, res);
			}, err);	
		}
	})(0, VOID);
};