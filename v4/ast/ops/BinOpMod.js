module.exports = BinOpMod

// TODO: mod should support string formatting e.g.
// "there are %d bananas in my basket" % [foo]

function BinOpMod(left, right) {
    this.left = left;
    this.right = right;
}

BinOpMod.prototype.type = require('../type')('BIN_OP_MOD', {binOp: true});

BinOpMod.prototype.evaluate = function(ctx, env, cont, err) {
    var right = this.right;
    return this.left.evaluate(ctx, env, function(l) {
        return right.evaluate(ctx, env, function(r) {
            if (typeof l !== 'number' || typeof r !== 'number') {
                return ctx.thunk(err, new Error('%: arguments must be numeric'));
            } else {
            	// http://stackoverflow.com/questions/4467539/javascript-modulo-not-behaving
                return ctx.thunk(cont, ((l % r) + r) % r);
            }
        }, err);
    }, err);
}
