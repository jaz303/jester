module.exports = Assign;

var find = require('../env').find;
var type = require('./type').types;

function Assign(assignee, value) {
	this.assignee = assignee;
	this.value = value;
}

Assign.prototype.type = require('./type')('ASSIGN');

Assign.prototype.evaluate = function(ctx, env, cont, err) {
	var assignee = this.assignee;
	return this.value.evaluate(ctx, env, function(value) {
		if (assignee.type === type.IDENT) {
			var targetEnv = find(env, assignee.name);
			if (!targetEnv) {
				targetEnv = env;
			}
			// /	return ctx.thunk(err, new Error("undefined variable: " + assignee.name));
			// } else {
				targetEnv[assignee.name] = value;
				return ctx.thunk(cont, value);
			// }	
		} else if (assignee.type === type.GLOBAL_IDENT) {
			ctx.globals[assignee.name] = value;
			return ctx.thunk(cont, value);
		} else {
			return ctx.thunk(err, new Error("invalid lval in assignment"));
		}
	}, err);
}