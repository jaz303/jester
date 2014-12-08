module.exports = analyse;

var A 				= require('../ast');
var BlockScope		= require('./BlockScope');
var ClosureScope	= require('./ClosureScope');
var ModuleScope 	= require('./ModuleScope');

function analyse(module) {
	walkBody(module.scope = new ModuleScope(), module.body);
	return module;
}

function walkBody(scope, body) {
	body.forEach(function(stmt) {
		if (stmt.type === A.T_FUNCTION_DEF) {
			scope.addFunctionDefinition(stmt.name, stmt);
		} else {
			walkStatement(scope, stmt);
		}
	});
	body.forEach(function(stmt) {
		if (stmt.type === A.T_FUNCTION_DEF) {
			stmt.scope = new ClosureScope(scope);
			stmt.params.forEach(function(p) {
				stmt.scope.addLocalVariable(p.name);
			});
			walkBody(stmt.scope, stmt.body);
		}
	});
}

var SW = {};

function walkStatement(scope, stmt) {
	if (stmt.type in SW) {
		return SW[stmt.type](scope, stmt);
	} else {
		return walkExpression(scope, stmt);
	}
}

SW[A.T_LOCAL_VARIABLES]			= walkLocalVariables;
SW[A.T_WHILE_STATEMENT]			= walkWhileStatement;
SW[A.T_LOOP_WHILE_STATEMENT]	= walkLoopWhileStatement;
SW[A.T_LOOP_STATEMENT]			= walkLoopStatement;
SW[A.T_FOR_STATEMENT]			= walkForStatement;
SW[A.T_FOREACH_STATEMENT]		= walkForeachStatement;
SW[A.T_IF_STATEMENT]			= walkIfStatement;
SW[A.T_RETURN_STATEMENT]		= walkReturnStatement;
SW[A.T_YIELD_STATEMENT]			= walkYieldStatement;

var EW = {};

function walkExpression(scope, exp) {
	if (typeof exp === 'string' || typeof exp === 'boolean' || typeof exp === 'number') {
		// no-op ?
	} else if (exp.type in EW) {
		return EW[exp.type](scope, exp);
	} else {
		throw new Error("unknown expression type: " + exp.type);
	}
}

EW[A.T_ASSIGN]					= walkAssign;
EW[A.T_UNARY_OP]				= walkUnaryOp;
EW[A.T_BINARY_OP]				= walkBinaryOp;
EW[A.T_LOGICAL_OR]				= walkLogicalOr;
EW[A.T_LOGICAL_AND]				= walkLogicalAnd;
EW[A.T_MISSING_ARGUMENT]		= walkMissingArgument;
EW[A.T_CALL]					= walkCall;
EW[A.T_COMPUTED_MEMBER_EXP]		= walkComputedMember;
EW[A.T_STATIC_MEMBER_EXP]		= walkStaticMember;
EW[A.T_ARRAY_LITERAL]			= walkArrayLiteral;
EW[A.T_DICTIONARY_LITERAL]		= walkDictionaryLiteral;
EW[A.T_GLOBAL_OBJECT]			= walkGlobalObject;
EW[A.T_GLOBAL_IDENT]			= walkGlobalIdent;
EW[A.T_LAMBDA]					= walkLambda;
EW[A.T_IDENT]					= walkIdent;
EW[A.T_NAMED_COLOR]				= walkNamedColor;
EW[A.T_HEX_COLOR]				= walkHexColor;

function walkLocalVariables(scope, stmt) {
	stmt.forEach(function(local) {
		scope.addLocalVariable(local.name);
	});
}

function walkWhileStatement(scope, stmt) {
	walkExpression(scope, stmt.cond);
	walkBody(stmt.scope = new BlockScope(scope), stmt.body);
}

function walkLoopWhileStatement(scope, stmt) {
	walkExpression(scope, stmt.cond);
	walkBody(stmt.scope = new BlockScope(scope), stmt.body);
}

function walkLoopStatement(scope, stmt) {
	walkBody(stmt.scope = new BlockScope(scope), stmt.body);
}

function walkForStatement(scope, stmt) {
	walkExpression(scope, stmt.start);
	walkExpression(scope, stmt.end);
	if (stmt.step !== null) {
		walkExpression(scope, stmt.step);
	}
	stmt.scope = new BlockScope(scope);
	stmt.scope.addLocalVariable(stmt.subject);
	walkBody(stmt.scope, stmt.body);
}

function walkForeachStatement(scope, stmt) {
	walkExpression(scope, stmt.exp);
	stmt.scope = new BlockScope(scope);
	stmt.scope.addLocalVariable(stmt.value);
	if (stmt.key !== null) {
		stmt.scope.addLocalVariable(stmt.key);
	}
	walkBody(stmt.scope, stmt.body);
}

function walkIfStatement(scope, stmt) {
	stmt.clauses.forEach(function(clause) {
		if (clause.cond) {
			walkExpression(scope, clause.cond);
		}
		walkBody(clause.scope = new BlockScope(scope), clause.body);
	});
}

function walkReturnStatement(scope, stmt) {
	if (stmt.exp) {
		walkExpression(stmt.exp);
	}
}

function walkYieldStatement(scope, stmt) {
	// no-op
}

function walkAssign(scope, exp) {
	if (exp.left && exp.left.type === A.T_IDENT) {
		scope.symbolAssigned(exp.left.name);
	} else {
		walkExpression(scope, exp.left);
	}
	walkExpression(scope, exp.right);
}

function walkUnaryOp(scope, exp) {
	walkExpression(scope, exp.exp);
}

function walkBinaryOp(scope, exp) {
	walkExpression(scope, exp.left);
	walkExpression(scope, exp.right);
}

function walkLogicalOr(scope, exp) {
	walkExpression(scope, exp.left);
	walkExpression(scope, exp.right);
}

function walkLogicalAnd(scope, exp) {
	walkExpression(scope, exp.left);
	walkExpression(scope, exp.right);
}

function walkMissingArgument(scope, exp) {
	// TODO: might be better to handle this *in* the call
	// expression so we can sneakily alter the type of the
	// AST node.
}

function walkCall(scope, exp) {
	walkExpression(scope, exp.callee);
	exp.args.forEach(function(arg) {
		walkExpression(scope, arg);
	});
}

function walkComputedMember(scope, exp) {
	walkExpression(scope, exp.subject);
	walkExpression(scope, exp.property);
}

function walkStaticMember(scope, exp) {
	walkExpression(scope, exp.subject);
}

function walkArrayLiteral(scope, exp) {
	exp.items.forEach(function(item) {
		walkExpression(scope, item);
	});
}

function walkDictionaryLiteral(scope, exp) {
	exp.pairs.forEach(function(pair) {
		walkExpression(scope, pair.value);
	});
}

function walkGlobalObject(scope, exp) {
	// no-op
}

function walkGlobalIdent(scope, exp) {
	// no-op
}

function walkLambda(scope, exp) {
	// not sure what to do here...
}

function walkIdent(scope, exp) {
	// not sure what to do here...
}

function walkNamedColor(scope, exp) {
	// no-op
}

function walkHexColor(scope, exp) {
	// no-op
}
