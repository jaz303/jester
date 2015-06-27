var fs = require('fs');

var BIN_OPS = {
	'Add': {
		op: '+'
	},
	'Sub': {
		op: '-'
	},
	'Mul': {
		op: '*'
	},
	'Div': {
		op: '/'
	},
	'IntDiv': {
		op: '\\',
		decls: "var floor = Math.floor;",
		calculate: "floor($left / $right)"
	},
	'Mod': {
		op: '%'
	},
	'Pow': {
		op: '**',
		decls: "var pow = Math.pow;",
		calculate: "pow($left, $right)"
	},
	'BitwiseAnd': {
		op: '&'
	},
	'BitwiseOr': {
		op: '|'
	},
	'BitwiseXor': {
		op: '^'
	},
	'ShiftLeft': {
		op: '<<'
	},
	'ShiftRight': {
		op: '>>'
	},
	'CmpLE': { op: '<=' },
	'CmpLT': { op: '<' },
	'CmpGE': { op: '>=' },
	'CmpGT': { op: '>' },
	'CmpEQ': { op: '==' },
	'CmpNEQ': { op: '!=' }
};

var binOpTemplate = [
	"module.exports = BinOp$name",
	"",
	"$decls",
	"",
	"function BinOp$name(left, right) {",
	"    this.left = left;",
	"    this.right = right;",
	"}",
	"",
	"BinOp$name.prototype.evaluate = function(ctx, env, cont, err) {",
	"    var right = this.right;",
	"    return this.left.evaluate(ctx, env, function(l) {",
	"        return right.evaluate(ctx, env, function(r) {",
	"            if (typeof l !== 'number' || typeof r !== 'number') {",
	"                return ctx.thunk(err, new Error('$op: arguments must be numeric'));",
	"            } else {",
	"                $impl",
	"            }",
	"        }, err);",
    "    }, err);",
	"}"
];

function genBinOp(name, opts) {
	var impl;
	if (opts.calculate) {
		impl = "return ctx.thunk(cont, " + opts.calculate + ");";
	} else {
		impl = "return ctx.thunk(cont, $left " + opts.op + " $right);";
	}
	var code = binOpTemplate.join("\n");
	code = code
			.replace(/\$name/g, name)
			.replace(/\$decls/g, opts.decls || '')
			.replace(/\$impl/g, impl)
			.replace(/\$left/g, "l")
			.replace(/\$right/g, "r")
			.replace(/\$op/g, opts.op);
	var file = 'BinOp' + name;
	fs.writeFileSync(__dirname + '/' + file + '.js', code, 'utf8');
}

for (var k in BIN_OPS) {
	genBinOp(k, BIN_OPS[k]);
}
