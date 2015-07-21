module.exports = ComputedMember;

function ComputedMember(subject, memberExp) {
	this.subject = subject;
	this.memberExp = memberExp;
}

ComputedMember.prototype.type = require('./type')('COMPUTED_MEMBER');

ComputedMember.prototype.evaluate = function(ctx, env, cont, err) {
	var memberExp = this.memberExp;
	return this.subject.evaluate(ctx, env, function(subject) {
		return memberExp.evaluate(ctx, env, function(member) {
			if (subject) {
				if (subject.__jtype === 'dict') {
					if (typeof member === 'string') {
						return ctx.thunk(cont, subject.items[member] || ctx.VOID);
					} else {
						return ctx.thunk(err, new Error("dictionary key must be a string"));
					}
				} else if (subject.__jtype === 'array') {
					if (typeof member === 'number') {
						if (member < 0 || member >= subject.items.length) {
							return ctx.thunk(err, new Error("index out of bounds"));
						} else {
							return ctx.thunk(cont, subject.items[member]);
						}
					} else {
						return ctx.thunk(err, new Error("array index must be numeric"));
					}
				}
			}
			return ctx.thunk(err, new Error("attempted to look up computed member on non-object"));
		}, err);
	}, err);
}
