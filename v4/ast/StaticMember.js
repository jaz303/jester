module.exports = StaticMember;

function StaticMember(subject, member) {
	this.subject = subject;
	this.member = member;
}

StaticMember.prototype.type = require('./type')('STATIC_MEMBER');

StaticMember.prototype.evaluate = function(ctx, env, cont, err) {
	return this.subject.evaluate(ctx, env, function(res) {
		if (res && res.__jtype === 'dict') {
			return ctx.thunk(cont, res.items[member] || ctx.VOID);
		} else {
			return ctx.thunk(err, new Error("not an object"));
		}
	}, err);
}
