module.exports = BinOpBitwiseAnd

function BinOpBitwiseAnd(left, right) {
    this.left = left;
    this.right = right;
}

BinOpBitwiseAnd.prototype.type = require('../type')('BIN_OP_BITWISE_AND', {binOp: true});

BinOpBitwiseAnd.prototype.evaluate = function(ctx, env, cont, err) {
    var right = this.right;
    return this.left.evaluate(ctx, env, function(l) {
        return right.evaluate(ctx, env, function(r) {
            if (typeof l !== 'number' || typeof r !== 'number') {
                return ctx.thunk(err, new Error('&: arguments must be numeric'));
            } else {
                return ctx.thunk(cont, l & r);
            }
        }, err);
    }, err);
}