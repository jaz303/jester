module.exports = UnOpNegative;

function UnOpNegative(exp) {
    this.exp = exp;
}

UnOpNegative.prototype.type = require('../type')('UN_OP_NEGATIVE', {unOp: true});

UnOpNegative.prototype.evaluate = function(ctx, env, cont, err) {
    return this.exp.evaluate(ctx, env, function(val) {
        if (typeof val !== 'number') {
            return ctx.thunk(err, new Error("-: argument must be numeric"));
        } else {
            return ctx.thunk(cont, -val);
        }
    }, err);
}
