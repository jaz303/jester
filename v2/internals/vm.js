module.exports = vm;

//
// Opcode Definitions

var OPCODES		= {},
	OPCODE_META	= {};

var _o = 1, o = function(name, desc) {
	var opcode = (_o++);
	OPCODES[name] = opcode;
	OPCODE_META[opcode] = {name: name, desc: desc};
	return opcode;
}

var OP_ADD			= o('ADD',			'Add'),
	OP_EXIT 		= o('EXIT',			'Exit task');

//
//


function vm() {

	var R, B, RA, RB, RC;

	function exec() {
		for (;;) {
			switch (op & 0x000000FF) {
				case OP_ADD:
					RA = (op & 0xFF000000) >> 24;
					RB = (op & 0x00FF0000) >> 16;
					RC = (op & 0x0000FF00) >>  8;
					R[B+RA] = R[B+RB] + R[B+RC];
					break;
				case OP_EXIT:
					return;
			}	
		}
	}

}

module.exports.OPCODES = OPCODES;
module.exports.OPCODE_META = OPCODE_META;