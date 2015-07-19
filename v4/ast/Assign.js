module.exports = Assign;

var find = require('../env').find;
var type = require('./type').types;

function Assign(assignee, value) {
	this.assignee = assignee;
	this.value = value;
}

Assign.prototype.type = require('./type')('ASSIGN');

// TODO: are order of operations correct here?
// at the moment value is always evaluated first, before any computed
// member expressions - is this right?
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
		} else if (assignee.type === type.COMPUTED_MEMBER) {
			return assignee.subject.evaluate(ctx, env, function(subject) {
				if (!subject) {
					return ctx.thunk(err, new Error("cannot dereference null value"));
				}
				return assignee.memberExp.evaluate(ctx, env, function(member) {
					if (subject.__jtype === 'array') {
						if (typeof member !== 'number') {
							return ctx.thunk(err, new Error("array index must be a number"));
						} else if (member < 0 || member >= subject.items.length) {
							return ctx.thunk(err, new Error("index out of bounds"));
						} else {
							subject.items[member] = value;
							return ctx.thunk(cont, value);
						}
					} else if (subject.__jtype === 'dict') {
						return ctx.thunk(err, new Error("dictionary assignment not implemented"));
					} else {
						return ctx.thunk(err, new Error("lval of computed member assignment must be array or dictionary"));
					}
				}, err);
			}, err);
		} else if (assignee.type === type.STATIC_MEMBER) {
			return ctx.thunk(err, new Error("static member assignment not implemented"));
		} else {
			return ctx.thunk(err, new Error("invalid lval in assignment"));
		}
	}, err);
}