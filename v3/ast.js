var _n = 1; function iota() { return _n++; }

var T_MODULE				= exports.T_MODULE 					= iota();
var T_ARRAY_LITERAL			= exports.T_ARRAY_LITERAL			= iota();
var T_DICTIONARY_LITERAL 	= exports.T_DICTIONARY_LITERAL 		= iota();
var T_GLOBAL_OBJECT 		= exports.T_GLOBAL_OBJECT 			= iota();
var T_GLOBAL_IDENT 			= exports.T_GLOBAL_IDENT 			= iota();
var T_LAMBDA 				= exports.T_LAMBDA 					= iota();
var T_IDENT 				= exports.T_IDENT 					= iota();
var T_WHILE_STATEMENT 		= exports.T_WHILE_STATEMENT 		= iota();
var T_LOOP_WHILE_STATEMENT 	= exports.T_LOOP_WHILE_STATEMENT 	= iota();
var T_LOOP_STATEMENT 		= exports.T_LOOP_STATEMENT 			= iota();
var T_FOR_STATEMENT 		= exports.T_FOR_STATEMENT 			= iota();
var T_FOREACH_STATEMENT 	= exports.T_FOREACH_STATEMENT 		= iota();
var T_HEX_COLOR 			= exports.T_HEX_COLOR 				= iota();
var T_NAMED_COLOR 			= exports.T_NAMED_COLOR 			= iota();
var T_RETURN_STATEMENT 		= exports.T_RETURN_STATEMENT 		= iota();
var T_ASSIGN 				= exports.T_ASSIGN 					= iota();
var T_FUNCTION_DEF 			= exports.T_FUNCTION_DEF 			= iota();
var T_CALL 					= exports.T_CALL 					= iota();
var T_SPAWN 				= exports.T_SPAWN 					= iota();
var T_MISSING_ARGUMENT 		= exports.T_MISSING_ARGUMENT 		= iota();
var T_YIELD_STATEMENT 		= exports.T_YIELD_STATEMENT 		= iota();
var T_COMPUTED_MEMBER_EXP 	= exports.T_COMPUTED_MEMBER_EXP 	= iota();
var T_STATIC_MEMBER_EXP 	= exports.T_STATIC_MEMBER_EXP 		= iota();
var T_IF_STATEMENT 			= exports.T_IF_STATEMENT 			= iota();

var N_GLOBAL_OBJECT 		= { type: T_GLOBAL_OBJECT };
var N_MISSING_ARGUMENT 		= { type: T_MISSING_ARGUMENT };
var N_YIELD_STATEMENT 		= { type: T_YIELD_STATEMENT };

exports.module = module;
function module(ports, stmts) {
	return {
		type 	: T_MODULE,
		ports 	: ports,
		body 	: stmts
	};
}

exports.arrayLiteral = arrayLiteral;
function arrayLiteral(items) {
	return {
		type 	: T_ARRAY_LITERAL,
		items 	: items
	};
}

exports.dictionaryLiteral = dictionaryLiteral;
function dictionaryLiteral(pairs) {
	return {
		type 	: T_DICTIONARY_LITERAL,
		pairs 	: pairs
	};
}

exports.dictionaryPair = dictionaryPair;
function dictionaryPair(key, value) {
	return { key: key, value: value };
}

exports.globalObject = globalObject;
function globalObject() {
	return N_GLOBAL_OBJECT;
}

exports.globalIdent = globalIdent;
function globalIdent(name) {
	return {
		type 	: T_GLOBAL_IDENT,
		name 	: name
	};
}

exports.lambda = lambda;
function lambda(params, body) {
	return {
		type 	: T_LAMBDA,
		params 	: params,
		body  	: body
	};
}

exports.ident = ident;
function ident(name) {
	return {
		type 	: T_IDENT,
		name 	: name
	};
}

exports.hexColor = hexColor;
function hexColor(hex) {
	var val = parseInt(hex, 16);
	return {
		type 	: T_HEX_COLOR,
		a 		: (val >> 24) & 0xFF,
		r 		: (val >> 16) & 0xFF,
		g 		: (val >>  8) & 0xFF,
		b 		: (val >>  0) & 0xFF
	};
}

exports.namedColor = namedColor;
function namedColor(name) {
	return {
		type 	: T_NAMED_COLOR,
		name 	: name
	};
}

exports.whileStatement = whileStatement;
function whileStatement(condition, body) {
	return {
		type 	: T_WHILE_STATEMENT,
		cond 	: condition,
		body 	: body
	};
}

exports.loopWhileStatement = loopWhileStatement;
function loopWhileStatement(condition, body) {
	return {
		type 	: T_LOOP_WHILE_STATEMENT,
		cond 	: condition,
		body 	: body
	};
}

exports.loopStatement = loopStatement;
function loopStatement(body) {
	return {
		type 	: T_LOOP_STATEMENT,
		body 	: body
	};
}

exports.forStatement = forStatement;
function forStatement(subject, start, end, step, body) {
	return {
		type 	: T_FOR_STATEMENT,
		subject : subject,
		start 	: start,
		end 	: end,
		step 	: step,
		body 	: body
	};
}

exports.foreachStatement = foreachStatement;
function foreachStatement(subject1, subject2, exp, body) {
	return {
		type 	: T_FOREACH_STATEMENT,
		key 	: subject2 ? subject1 : null,
		value 	: subject2 ? subject2 : subject1,
		exp 	: exp,
		body	: body
	};
}

exports.ifStatement = ifStatement;
function ifStatement(clauses) {
	return {
		type 	: T_IF_STATEMENT,
		clauses : clauses
	}
}

exports.ifClause = ifClause;
function ifClause(exp, body) {
	return {
		cond 	: exp,
		body 	: body
	};
}

exports.functionDefinition = functionDefinition;
function functionDefinition(name, params, body) {
	return {
		type 	: T_FUNCTION_DEF,
		name 	: name,
		params 	: params,
		body 	: body
	};
}

exports.requiredParameter = requiredParameter;
function requiredParameter(name) {
	return {
		name 			: name,
		required 		: true,
		defaultValue	: null
	};
}

exports.optionalParameter = optionalParameter;
function optionalParameter(name, defaultValue) {
	return {
		name 			: name,
		required 		: false,
		defaultValue 	: defaultValue
	};
}

exports.returnStatement = returnStatement;
function returnStatement(exp) {
	return {
		type 	: T_RETURN_STATEMENT,
		exp 	: exp
	};
}

exports.yieldStatement = yieldStatement;
function yieldStatement() {
	return N_YIELD_STATEMENT;
}

exports.assignmentExp = assignmentExp;
function assignmentExp(lhs, rhs) {
	return {
		type 	: T_ASSIGN,
		left 	: lhs,
		right	: rhs
	};
}

exports.unaryOpExp = unaryOpExp;
function unaryOpExp(op, exp) {

}

exports.binaryOpExp = binaryOpExp;
function binaryOpExp(left, op, right) {

}

exports.logicalOrExp = logicalOrExp;
function logicalOrExp(left, right) {

}

exports.logicalAndExp = logicalAndExp;
function logicalAndExp(left, right) {
	
}

exports.missingArgument = missingArgument;
function missingArgument() {
	return N_MISSING_ARGUMENT;
}

exports.call = call;
function call(callee, args) {
	return {
		type	: T_CALL,
		callee	: callee,
		args 	: args
	};
}

exports.spawn = spawn;
function spawn(call) {
	return {
		type 	: T_SPAWN,
		call 	: call
	};
}

exports.computedMemberExp = computedMemberExp;
function computedMemberExp(subject, property) {
	return {
		type 		: T_COMPUTED_MEMBER_EXP,
		subject 	: subject,
		property 	: property
	};
}

exports.staticMemberExp = staticMemberExp;
function staticMemberExp(subject, name) {
	return {
		type 		: T_STATIC_MEMBER_EXP,
		subject 	: subject,
		property 	: name
	};	
}