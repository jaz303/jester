var A = module.exports = {
	Assign		: require('./Assign'),
	Block		: require('./Block'),
	Call		: require('./Call'),
	Fn 			: require('./Fn'),
	Ident 		: require('./Ident'),
	If 			: require('./If'),
	Literal		: require('./Literal'),
	Loop		: require('./Loop'),
	Module 		: require('./Module'),
	Spawn		: require('./Spawn'),
	While 		: require('./While'),
	Yield		: require('./Yield'),

	build 		: build
};

var ops = require('./ops');
for (var k in ops) {
	module.exports[k] = ops[k];
}

function build(thing) {
	if (!Array.isArray(thing)) {
		return thing;
	}
	if (typeof thing[0] === 'function') {
		var ctor = thing[0];
		var args = thing.slice(1).map(build);
		switch (args.length) {
			case 0: return new ctor();
			case 1: return new ctor(args[0]);
			case 2: return new ctor(args[0], args[1]);
			case 3: return new ctor(args[0], args[1], args[2]);
			case 4: return new ctor(args[0], args[1], args[2], args[3]);
			default: throw new Error("too many args!");
		}	
	} else {
		return thing.map(build);
	}
}