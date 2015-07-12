module.exports = UnOpLogicalNot;

function UnOpLogicalNot(exp) {
    this.exp = exp;
}

UnOpLogicalNot.prototype.type = require('../type')('UN_OP_LOGICAL_NOT', {unOp: true});

UnOpLogicalNot.prototype.evaluate = function(ctx, env, cont, err) {
    return this.exp.evaluate(ctx, env, function(val) {
    	return ctx.thunk(cont, !ctx.isTruthy(val));
    }, err);
}
