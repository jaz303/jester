module.exports = BinOpAdd

function BinOpAdd(left, right) {
    this.left = left;
    this.right = right;
}

BinOpAdd.prototype.type = require('../type')('BIN_OP_ADD', {binOp: true});

BinOpAdd.prototype.evaluate = function(ctx, env, cont, err) {
    var right = this.right;
    return this.left.evaluate(ctx, env, function(l) {
        return right.evaluate(ctx, env, function(r) {
        	var tl = typeof l, tr = typeof r;
        	if ((tl === 'string' || tl === 'number') && (tl === tr)) {
        		return ctx.thunk(cont, l + r);
        	} else {
        		return ctx.thunk(err, new Error("`+`: arguments must be numbers or strings"));
        	}
        }, err);
    }, err);
}