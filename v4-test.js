var A = require('./v4/ast');

var lastProfile;

function TestInc() {}
TestInc.prototype.evaluate = function(ctx, env, cont, err) {
	env.ops++;
	var now = Date.now();
	var delta = (now - lastProfile);
	if (delta >= 1000) {
		console.log((env.ops) + " ops/sec");
		env.ops = 0;
		lastProfile = now;
	}
	return ctx.thunk(cont, null);
}

var program = A.build([
	A.Module,
	[ A.Block, [
		[ A.While,
			[ A.Literal, true ],
			[ A.Block, [
				// [ A.Call,
				// 	[ A.Ident, "print" ], [
				// 		[ A.Ident, "x" ]
				// 	]
				// ],
				[ TestInc ]
			]]
		]
	]]
]);

var env = require('./v4/env').create({
	ops: 0,
	print: function(ctx, args) {
		console.log(args[0]);
	}
});

var ctx = require('./v4/context')();

lastProfile = Date.now();
ctx.start(program, env);

// console.log(require('util').inspect(program, {colors: true, depth: null}));