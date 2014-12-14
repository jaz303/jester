module.exports = Assembler;

var A = Assembler;
var C = CodeObjectCompiler;
var O = require('../runtime/opcodes');

var CodeObject = require('../runtime/CodeObject');

//
// Assembler

function Assembler() {

}

A.prototype.newCodeObject = function() {
	return new CodeObjectCompiler(this);
}

//
// CodeObject

function CodeObjectCompiler(assembler) {
	this.assembler = assembler;
	this.stackSize = 0;
	this.code = [];
	this.constants = [];
}

C.prototype.nop = function() {
	this.code.push(O.NOP);
}

C.prototype.loadtrue = function() {
	this.code.push(O.LOADTRUE);
}

C.prototype.loadfalse = function() {
	this.code.push(O.LOADFALSE);
}

C.prototype.loadConstant = function(a, k) {
	this.constants.push(k);
	this.loadk(a, this.constants.length - 1);
}

C.prototype.loadk = function(a, k) {
	a = (a & 0xFF) << 16;
	k = (k & 0xFFFF);
	this.code.push(O.LOADK | a | k);
}

C.prototype.halt = function() {
	this.code.push(O.HALT);
}

// R[a] := R[b] + R[c]
C.prototype.add = function(a, b, c) {
	a = (a & 0xFF) << 16;
	b = (b & 0xFF) <<  8;
	c = (c & 0xFF) <<  0;
	this.code.push(O.ADD | a | b | c);
}

C.prototype.compile = function() {
	var co = new CodeObject();
	co.stackSize = this.stackSize;
	co.constants = this.constants;
	co.code = new Uint32Array(this.code);
	return co;
}