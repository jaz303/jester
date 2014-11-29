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
	return { type: T_GLOBAL_OBJECT };
}

exports.globalIdent = globalIdent;
function globalIdent(name) {
	return {
		type 	: T_GLOBAL_IDENT,
		name 	: name
	};
}

exports.lambda = lambda;
function lambda(args, body) {
	return {
		type 	: T_LAMBDA,
		args 	: args,
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
function hexColor(name) {

}

exports.namedColor = namedColor;
function namedColor(name) {
	
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

}

exports.ifClause = ifClause;
function ifClause(exp, body) {

}

exports.functionDefinition = functionDefinition;
function functionDefinition(name, params, body) {

}

exports.requiredParameter = requiredParameter;
function requiredParameter(name) {

}

exports.optionalParameter = optionalParameter;
function optionalParameter(name, defaultValue) {

}

exports.returnStatement = returnStatement;
function returnStatement(exp) {

}

exports.yieldStatement = yieldStatement;
function yieldStatement() {

}

exports.assignmentExp = assignmentExp;
function assignmentExp(lhs, rhs) {

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

}

exports.call = call;
function call(callee, args) {

}

exports.spawn = spawn;
function spawn(call) {

}

exports.computedMemberExp = computedMemberExp;
function computedMemberExp(subject, property) {

}

exports.staticMemberExp = staticMemberExp;
function staticMemberExp(subject, name) {
	
}