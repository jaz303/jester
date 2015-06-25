module.exports = Block;

function Block(statements) {
	this.statements = statements;
}

Block.prototype.evaluate = function(ctx, env, cont, err) {
	var stmts = this.statements;
	var length = stmts.length;
	return (function _next(ix) {
		if (ix === length) {
			return ctx.thunk(cont, null);
		} else {
			return stmts[ix].evaluate(ctx, env, function() {
				return ctx.thunk(_next, ix+1);
			}, err);	
		}
	})(0);
};