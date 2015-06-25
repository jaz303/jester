module.exports = Loop;

var K = require('../K');

function Loop(body) {
	this.body = body;
}

Loop.prototype.evaluate = function(ctx, env, cont, err) {
	var body = this.body;
	return (function _loop() {
		return body.evaluate(ctx, env, function() {
			return ctx.yield(_loop);
		}, function(error) {
			if (error === K.BREAK) {
				return ctx.thunk(cont, null);
			} else if (error === K.NEXT) {
				return _loop();
			} else {
				return ctx.thunk(err, error);
			}
		});
	})();
};