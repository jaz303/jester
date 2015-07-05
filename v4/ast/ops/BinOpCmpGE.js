module.exports = BinOpCmpGE



function BinOpCmpGE(left, right) {
    this.left = left;
    this.right = right;
}

BinOpCmpGE.prototype.type = require('../type')('BIN_OP_CMP_GE', {binOp: true});

BinOpCmpGE.prototype.evaluate = function(ctx, env, cont, err) {
    var right = this.right;
    return this.left.evaluate(ctx, env, function(l) {
        return right.evaluate(ctx, env, function(r) {
            if (typeof l !== 'number' || typeof r !== 'number') {
                return ctx.thunk(err, new Error('>=: arguments must be numeric'));
            } else {
                return ctx.thunk(cont, l >= r);
            }
        }, err);
    }, err);
}