var A = require('./v4/ast');

require('es6-promise').polyfill();

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
		[ A.Spawn,
			[ A.Ident, 'looper' ], [
				[ A.Literal, 1 ],
				[ A.Literal, 0.5 ]
			]
		],
		[ A.Spawn,
			[ A.Ident, 'looper' ], [
				[ A.Literal, 2 ],
				[ A.Literal, 5 ]
			]
		]
	]]
]);

var env = require('./v4/env').create({
	looper: {
		__jtype: 'function',
		args: [ 'x', 'delay' ],
		body: A.build([
			A.Block, [
				[ A.Loop,
					[ A.Block, [
						[ A.Call,
							[ A.Ident, 'print' ], [
								[ A.Ident, 'x' ]
							]
						],
						[ A.Call,
							[ A.Ident, 'sleep' ], [
								[ A.Ident, 'delay' ]
							]
						]
					]]
				]
			]
		])
	},
	sleep: function(ctx, delay) {
		return new Promise(function(resolve) {
			setTimeout(resolve, delay[0] * 1000);
		});
	},
	ops: 0,
	print: function(ctx, args) {
		console.log(args[0]);
	}
});

var ctx = require('./v4/context')();

lastProfile = Date.now();
ctx.start(program, env);

// console.log(require('util').inspect(program, {colors: true, depth: null}));