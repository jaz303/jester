module.exports = Assign;

var find = require('../env').find;

function Assign(assignee, value) {
	this.assignee = assignee;
	this.value = value;
}

// TODO: doesn't support lvalues other than identifiers
// needs work to support arrays, properties...
Assign.prototype.evaluate = function(ctx, env, cont, err) {
	var assignee = this.assignee;
	return this.value.evaluate(ctx, env, function(value) {
		var targetEnv = find(env, assignee.name);
		if (!targetEnv) {
			targetEnv = env;
		}
		// /	return ctx.thunk(err, new Error("undefined variable: " + assignee.name));
		// } else {
			targetEnv[assignee.name] = value;
			return ctx.thunk(cont, value);
		// }
	}, err);
}