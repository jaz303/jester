#!/usr/bin/env node

var vm = require('./v3/runtime/VM').create();
var O = require('./v3/runtime/opcodes');

var mod = {
	k 		: [ 42, 50, 1337, 303 ],
	vars 	: [],
	code 	: []
};

// var co1 = {
// 	code: [
// 		O.LOADK | (0x0 << 16) | 0x00,
// 		O.PRINT | 0x00,
// 		O.LOADK | (0x0 << 16) | 0x01,
// 		O.PRINT | 0x00,
// 		O.JMP | 0x00
// 	],
// 	module: mod
// };

var co1 = {
	code: [
		// make function into R[1] from code object 0x01
		O.MKFUN | (0x01 << 16) | 0x01,
		O.MKFUN | (0x03 << 16) | 0x02,
		// spawn task from function in R[1], with 0 args, and place task object in R[0]
		O.SPAWN | (0x01 << 16) | (0x00 << 8) | (0x00 << 0),
		O.SPAWN | (0x03 << 16) | (0x00 << 8) | (0x00 << 2),
		O.TERM
	],
	module: mod
}

mod.code.push(co1);

var co2 = {
	code: [
		O.LOADK | (0x0 << 16) | 0x02,
		O.PRINT | 0x00,
		O.YIELD,
		O.JMP | 0x01
	],
	module: mod
};

mod.code.push(co2);

var co3 = {
	code: [
		O.LOADK | (0x0 << 16) | 0x03,
		O.PRINT | 0x00,
		O.YIELD,
		O.JMP | 0x01
	],
	module: mod
};

mod.code.push(co3);

vm.start(co1);

// console.log(vm);

// vm.run(co);

// var Assembler = require('./v3/compiler/Assembler');

// var asm = new Assembler();

// var cc = asm.newCodeObject();
// cc.stackSize = 3;
// cc.loadConstant(0, 10);
// cc.loadConstant(1, 35);
// cc.add(2, 0, 1);
// cc.halt();

// var co = cc.compile();

// console.log(co);





// var parser 		= require('./v3/parser'),
// 	analyse 	= require('./v3/analysis/analyse'),
//     fs      	= require('fs');

// var args = process.argv.slice(1);

// fs.readFile(args[1], 'utf8', function(err, source) {

// 	var mod = parser.parse(source);

// 	analyse(mod);

// });
