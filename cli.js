#!/usr/bin/env node

var vm = require('./v3/runtime/VM').create();
var O = require('./v3/runtime/opcodes');

var mod = {
	k 		: [ 42, 50 ],
	vars 	: [],
	code 	: []
};

var co1 = {
	code: [
		O.LOADK | (0x0 << 16) | 0x00,
		O.PRINT | 0x00,
		O.LOADK | (0x0 << 16) | 0x01,
		O.PRINT | 0x00,
		O.JMP | 0x00
	],
	module: mod
};

mod.code.push(co1);

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
