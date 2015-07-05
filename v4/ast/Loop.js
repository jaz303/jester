module.exports = Loop;

var K = require('../K');
var VOID = require('../runtime/void');

function Loop(body) {
	this.body = body;
}

Loop.prototype.type = require('./type')('LOOP');

Loop.prototype.evaluate = function(ctx, env, cont, err) {
	var body = this.body;
	return (function _loop() {
		return body.evaluate(ctx, env, function() {
			return ctx.yield(_loop);
		}, function(error) {
			if (error === K.BREAK) {
				return ctx.thunk(cont, VOID);
			} else if (error === K.NEXT) {
				return _loop();
			} else {
				return ctx.thunk(err, error);
			}
		});
	})();
};