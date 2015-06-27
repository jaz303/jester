module.exports = BinOpCmpEQ



function BinOpCmpEQ(left, right) {
    this.left = left;
    this.right = right;
}

BinOpCmpEQ.prototype.evaluate = function(ctx, env, cont, err) {
    var right = this.right;
    return this.left.evaluate(ctx, env, function(l) {
        return right.evaluate(ctx, env, function(r) {
            return ctx.thunk(cont, l === r);
        }, err);
    }, err);
}