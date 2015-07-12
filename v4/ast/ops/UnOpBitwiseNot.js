module.exports = UnOpBitwiseNot;

function UnOpBitwiseNot(exp) {
    this.exp = exp;
}

UnOpBitwiseNot.prototype.type = require('../type')('UN_OP_BITWISE_NOT', {unOp: true});

UnOpBitwiseNot.prototype.evaluate = function(ctx, env, cont, err) {
    return this.exp.evaluate(ctx, env, function(val) {
        if (typeof val !== 'number') {
            return ctx.thunk(err, new Error("~: argument must be numeric"));
        } else {
            return ctx.thunk(cont, ~val);
        }
    }, err);
}
