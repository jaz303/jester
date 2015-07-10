module.exports = BinOpLogicalOr

function BinOpLogicalOr(left, right) {
    this.left = left;
    this.right = right;
}

BinOpLogicalOr.prototype.type = require('../type')('BIN_OP_LOGICAL_OR', {binOp: true});

BinOpLogicalOr.prototype.evaluate = function(ctx, env, cont, err) {
    var right = this.right;
    return this.left.evaluate(ctx, env, function(l) {
        if (ctx.isTruthy(l)) {
            return ctx.thunk(cont, l);
        }
        return right.evaluate(ctx, env, function(r) {
            return ctx.thunk(cont, r);
        }, err);
    }, err);
}