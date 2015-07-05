module.exports = While;

var K = require('../K');
var VOID = require('../runtime/void');

function While(condition, body) {
	this.condition = condition;
	this.body = body;
}

While.prototype.type = require('./type')('WHILE');

While.prototype.evaluate = function(ctx, env, cont, err) {
	var condition = this.condition;
	var body = this.body;
	return (function _loop() {
		return condition.evaluate(ctx, env, function(res) {
			if (!ctx.isTruthy(res)) {
				return ctx.thunk(cont, VOID);
			} else {
				return body.evaluate(ctx, env, function(res) {
					return _loop(res);
				}, function(error) {
					if (error === K.BREAK) {
						return ctx.thunk(cont, VOID);
					} else if (err !== K.NEXT) {
						return ctx.thunk(err, error);
					} else {
						return _loop();
					}
				});	
			}
		}, err);
	})();	
};