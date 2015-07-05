module.exports = BinOpCmpNEQ



function BinOpCmpNEQ(left, right) {
    this.left = left;
    this.right = right;
}

BinOpCmpNEQ.prototype.type = require('../type')('BIN_OP_CMP_NEQ', {binOp: true});

BinOpCmpNEQ.prototype.evaluate = function(ctx, env, cont, err) {
    var right = this.right;
    return this.left.evaluate(ctx, env, function(l) {
        return right.evaluate(ctx, env, function(r) {
            return ctx.thunk(cont, l !== r);
        }, err);
    }, err);
}