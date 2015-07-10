module.exports = BinOpLogicalAnd

function BinOpLogicalAnd(left, right) {
    this.left = left;
    this.right = right;
}

BinOpLogicalAnd.prototype.type = require('../type')('BIN_OP_LOGICAL_AND', {binOp: true});

BinOpLogicalAnd.prototype.evaluate = function(ctx, env, cont, err) {
    var right = this.right;
    return this.left.evaluate(ctx, env, function(l) {
        if (!ctx.isTruthy(l)) {
            return ctx.thunk(cont, false);
        }
        return right.evaluate(ctx, env, function(r) {
            return ctx.thunk(cont, r);
        }, err);
    }, err);
}