var nextType = 1;

module.exports = function(name, opts) {
	var thisType = nextType++;
	if (opts && opts.binOp) {
		thisType |= types.BIN_OP;
	}
	types[name] = thisType;
	return thisType;
}

var types = module.exports.types = {
	BIN_OP: 0x80000000
};