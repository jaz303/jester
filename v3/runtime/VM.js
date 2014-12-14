var opcodes = exports.opcodes = {};

function op(name, code) {
	code <<= 26;
	opcodes[name] = code;
	return code;
}

var DEFAULT_STACK_SIZE = 16;

var OP_NOP 			= op('NOP', 		1);
var OP_HALT 		= op('HALT', 		2);
var OP_LOADK 		= op('LOADK', 		3);
var OP_LOADTRUE		= op('LOADTRUE',	4);
var OP_LOADFALSE 	= op('LOADFALSE',	5);
var OP_ADD 			= op('ADD', 		6);

exports.create = create;
function create() {

	var stack = new Array(DEFAULT_STACK_SIZE);

	function exec() {

	}

	return {
		run: function(co) {

			var code	= co.code;
			var sp 		= 0;
			var ip 		= 0;
			var k 		= co.constants;

			var a, b, c;

			for (;;) {
				var ins = code[ip++];
				switch (ins & 0xFC000000) {
					case OP_NOP:
						break;
					case OP_HALT:
						console.log(stack);
						return;
					case OP_LOADK:
						stack[sp + ((ins & 0x00FF0000) >> 16)] = k[ins & 0xFFFF];
						break;
					case OP_LOADTRUE:
						stack[sp + ((ins & 0x00FF0000) >> 16)] = true;
						break;
					case OP_LOADFALSE:
						stack[sp + ((ins & 0x00FF0000) >> 16)] = false;
						break;
					case OP_ADD:
						a = (ins & 0x00FF0000) >> 16;
						b = (ins & 0x0000FF00) >> 8;
						c = (ins & 0x000000FF);
						stack[sp + a] = stack[sp + b] + stack[sp + c];
						break;
					default:
						console.error("abort!");
				}
			}

		}
	};

}