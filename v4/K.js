exports.BREAK 	= sym('BREAK');
exports.NEXT	= sym('NEXT');
exports.RETURN 	= sym('RETURN');

function sym(name) {
	return (typeof Symbol === 'undefined')
			? {}
			: new Symbol(name);
}