var opcodes = exports.opcodes = {};

function op(name, code) {
	code <<= 26;
	opcodes[name] = code;
	return code;
}

var DEFAULT_STACK_SIZE = 16;

var OP_NOP 			= op('NOP', 		0);
var OP_JMP 			= op('JMP', 		1);
var OP_LOADK 		= op('LOADK', 		2);
var OP_PRINT 		= op('PRINT', 		3);
var OP_YIELD 		= op('YIELD',		4);
var OP_TERM 		= op('TERM',		5);
var OP_MKFUN 		= op('MKFUN', 		6);
var OP_SPAWN 		= op('SPAWN', 		7);

// var OP_HALT 		= op('HALT', 		2);

// var OP_LOADTRUE		= op('LOADTRUE',	4);
// var OP_LOADFALSE 	= op('LOADFALSE',	5);
// var OP_ADD 			= op('ADD', 		6);
// var OP_MOVE 		= op('MOVE', 		7);
// var OP_MGET 		= op('MGET', 		8);
// var OP_MSET 		= op('MSET', 		9);
// var OP_MKFUN 		= op('MKFUN',	 	10);

function Task(stackSize, co) {
	this.__jtype = 'task';
	this.stack 	= new Array(stackSize);
	this.fp = 0;
	this.frames	= [{
		code 	: co,
		ip 		: 0,
		sp 		: 0
	}];
}

exports.create = create;
function create() {

	var state = 'stopped';
	var runnableTasks = [];

	function tick() {
		run();
		if (state !== 'stopped') {
			setTimeout(tick, 0);
		}
	}

	function run() {

		if (runnableTasks.length === 0) {
			state = 'stopped'
			return;
		}

		var task 	= runnableTasks.shift();
		var stack 	= task.stack;
		var frame 	= task.frames[task.fp];
		var co 		= frame.code;
		var ops 	= co.code;
		var mod 	= co.module;
		var ip 		= frame.ip;
		var sp 		= frame.sp;

		for (;;) {
			var ins = ops[ip++];
			switch (ins & 0xFC000000) {
				case OP_NOP:
					// do nothing
					break;
				case OP_JMP:
					ip = ins & 0x00FFFFFF;
					break;
				case OP_LOADK:
					stack[sp + (ins >> 16) & 0xFF] = mod.k[ins & 0xFFFF];
					break;
				case OP_PRINT:
					console.log(stack[sp + (ins & 0xFF)]);
					break;
				case OP_YIELD:
					runnableTasks.push(task);
					return;
				case OP_TERM:
					return;
				case OP_MKFUN:
					stack[sp + (ins >> 16) & 0xFF] = {
						__jtype: 'function',
						code: mod.code[ins & 0xFFFF]
					};
					break;
				case OP_SPAWN:
					var co = stack[sp + (ins >> 16) & 0xFF];
					var newTask = stack[sp + (ins & 0xFF)] = new Task(DEFAULT_STACK_SIZE, co.code);
					runnableTasks.push(newTask);
					break;
				default:
					throw new Error("unknown opcode: " + (ins & 0xFC000000));
			}
		}

	}

	return {
		start: function(co) {
			state = 'running';
			runnableTasks.push(new Task(DEFAULT_STACK_SIZE, co));
			tick();
		}
	};

	// var stack = new Array(DEFAULT_STACK_SIZE);
	// var mvars = [];

	// function exec() {

	// }

	// return {
	// 	mvars: mvars,

	// 	run: function(co) {

	// 		var code	= co.code;
	// 		var sp 		= 0;
	// 		var ip 		= 0;
	// 		var k 		= co.constants;

	// 		var a, b, c;

	// 		for (;;) {
	// 			var ins = code[ip++];
	// 			switch (ins & 0xFC000000) {
	// 				case OP_NOP:
	// 					break;
	// 				case OP_HALT:
	// 					console.log(stack);
	// 					return;
	// 				case OP_LOADK:
	// 					stack[sp + ((ins & 0x00FF0000) >> 16)] = k[ins & 0xFFFF];
	// 					break;
	// 				case OP_LOADTRUE:
	// 					stack[sp + ((ins & 0x00FF0000) >> 16)] = true;
	// 					break;
	// 				case OP_LOADFALSE:
	// 					stack[sp + ((ins & 0x00FF0000) >> 16)] = false;
	// 					break;
	// 				case OP_ADD:
	// 					a = (ins & 0x00FF0000) >> 16;
	// 					b = (ins & 0x0000FF00) >> 8;
	// 					c = (ins & 0x000000FF);
	// 					stack[sp + a] = stack[sp + b] + stack[sp + c];
	// 					break;
	// 				case OP_MOVE:
	// 					a = (ins & 0x00FF0000) >> 16;
	// 					b = (ins & 0x0000FF00) >> 8;
	// 					stack[sp + a] = stack[sp + b];
	// 					break;
	// 				case OP_MGET:
	// 					a = (ins & 0x00FF0000) >> 16;
	// 					m = (ins & 0x0000FFFF);
	// 					stack[sp + a] = mvars[m];
	// 					break;
	// 				case OP_MSET:
	// 					a = (ins & 0x00FF0000) >> 16;
	// 					m = (ins & 0x0000FFFF);
	// 					mvars[m] = stack[sp + a];
	// 					break;
	// 				case OP_MKFUN:
	// 					a = (ins & 0x00FF0000) >> 16;
	// 					m = (ins & 0x0000FFFF);
	// 					stack[sp + a] = { type: 'function', co: mvars[m] };
	// 					break;
	// 				default:
	// 					console.error("abort!");
	// 					break;
	// 			}
	// 		}

	// 	}
	// };

}