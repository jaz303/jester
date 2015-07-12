module.exports = UnOpPositive;

function UnOpPositive(exp) {
    this.exp = exp;
}

UnOpPositive.prototype.type = require('../type')('UN_OP_POSITIVE', {unOp: true});

UnOpPositive.prototype.evaluate = function(ctx, env, cont, err) {
    return this.exp.evaluate(ctx, env, function(val) {
        if (typeof val !== 'number') {
            return ctx.thunk(err, new Error("+: argument must be numeric"));
        } else {
            return ctx.thunk(cont, +val);
        }
    }, err);
}
