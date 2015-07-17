"use strict";

module.exports = create;

var A 			= require('./ast');
var L 			= require('./lexer');
var T 			= require('./tokens');
var ParseError 	= require('./ParseError');

function create(source) {

	var lexer, state, curr, functions;

	function reset(source) {
		lexer = L();
		state = lexer.start(source);
		curr = null;
		functions = [null];
	}

	//
	// helpers

	function next() {
	    curr = lexer.lex(state);
	    return curr;
	}

	function text() {
	    return state.text;
	}

	function accept(token, msg) {
	    if (curr !== token) {
	        error(msg || "parse error", token);
	    } else {
	        next();
	    }
	}

	function at(token) {
	    return curr === token;
	}

	function error(msg, expectedToken) {
	    if (curr === T.ERROR) {
	        msg = lexer.error();
	    }
	    throw new ParseError(
	        msg,
	        state.line,
	        state.column,
	        expectedToken || '<unknown>',
	        curr
	    );
	}

	function requireident() {
		if (curr !== T.IDENT)
	        noident();
	    var text = state.text;
	    next();
	    return text;
	}

	function noident() {
	    error('expected identifier', T.IDENT);
	}

	function atBlockStatementStart() {
		return curr === T.WHILE
				|| curr === T.LOOP
				|| curr === T.DEF
				|| curr === T.IF;
		// return curr === T.IF
	    //         || curr === T.WHILE
	    //         || curr === T.LOOP
	    //         || curr === T.FOREACH
	    //         || curr === T.DEF;
	}

	function eof() {
		return curr === T.EOF;
	}

	function atBlockTerminator() {
	    return curr === T.RBRACE;
	}

	function atStatementTerminator() {
	    return curr === T.SEMICOLON || curr === T.NL;
	}

	function skipNewlines() {
	    while (curr === T.NL)
	        next();
	}

	function skipStatementTerminators() {
	    while (atStatementTerminator())
	        next();
	}

	//
	// decoders

	function decodeString(str) {
	    return str.substr(1, str.length - 2)
	              .replace(/\\r/g,  "\r")
	              .replace(/\\n/g,  "\n")
	              .replace(/\\t/g,  "\t")
	              .replace(/\\\\/g, "\\")
	              .replace(/\\'/g,  "'")
	              .replace(/\\"/g,  "\"");
	}

	//
	//

	function parseModule() {
		next();
		skipNewlines();
		var stmts = parseStatements();
		accept(T.EOF);
		return new A.Module(stmts);
	}

	function parseBlock() {
		accept(T.LBRACE);
		var block = parseStatements();
		accept(T.RBRACE);
		return block;
	}

	function parseStatements() {
		var stmts = [];
		skipStatementTerminators();
		while (!atBlockTerminator() && !eof()) {
			if (atBlockStatementStart()) {
				stmts.push(parseBlockStatement());
				skipStatementTerminators();
			} else {
				stmts.push(parseInlineStatement());
				if (atStatementTerminator()) {
					skipStatementTerminators();
				} else {
					break;
				}
			}
		}
		return new A.Statements(stmts);
	}

	function parseBlockStatement() {
		if (curr === T.WHILE) {
			return parseWhileStatement();
		} else if (curr === T.LOOP) {
			return parseLoopStatement();
		} else if (curr === T.IF) {
			return parseIfStatement();
		} else if (curr === T.DEF) {
			return parseFunctionDefinition();
		} else {
			error("expected 'while'");
		}
	}

	function parseWhileStatement() {
	    var line = state.line;
	    accept(T.WHILE);
	    var condition = parseExpression();
	    skipNewlines();
	    var body = parseBlock();
	    return new A.While(condition, body);
	}

	function parseLoopStatement() {
	    var line = state.line;
	    accept(T.LOOP);
	    skipNewlines();
	    var body = parseBlock();
	    return new A.Loop(body);
	}

	function parseIfStatement() {
		var conditions = [];
		var bodies = [];

		accept(T.IF);

		conditions.push(parseExpression());
		skipNewlines();
		bodies.push(parseBlock());
		skipNewlines();

		while (curr === T.ELSE) {
			next();
			if (curr === T.IF) {
				next();
				conditions.push(parseExpression());
				skipNewlines();
				bodies.push(parseBlock());
				skipNewlines();
			} else {
				conditions.push(null);
				skipNewlines();
				bodies.push(parseBlock());
				skipNewlines();
				break;
			}
		}

		return new A.If(conditions, bodies);
	}

	function parseFunctionDefinition() {
		accept(T.DEF);
		var name = requireident();
		var params;
		if (curr === T.LPAREN) {
	        next();
	        params = parseFunctionParameters();
	        accept(T.RPAREN);
	    } else {
	        params = [];
	    }
		skipNewlines();
		var body = parseBlock();
		return new A.Fn(name, params, body);
	}

	function parseFunctionParameters() {
	    var params = [], optional = false;
	    while (curr === T.IDENT) {
	        var param = { name: state.text, optional: false, defaultValue: void 0 };
	        next();
	        if (curr === T.EQUALS) {
	            next();
	            param.optional = true;
	            // FIXME: shouldn't be allowing full expressions in here
	            param.defaultValue = parseExpression();
	            optional = true;
	        } else if (optional) {
	            error("required parameters cannot follow optional parameters");
	        }
	        params.push(param);
	        if (curr === T.COMMA) {
	            next();
	        } else {
	            break;
	        }
	    }
	    return params;
	}

	function parseInlineStatement() {
		if (curr === T.RETURN) {
			return parseReturnStatement();
		} else {
			return parseExpression();	
		}
	}

	function parseReturnStatement() {
	    accept(T.RETURN);
	    if (eof() || atBlockTerminator() || atStatementTerminator()) {
	        return new A.Return(void 0)
	    } else {
	    	return new A.Return(parseExpression());
	    }
	}

	function parseExpression() {
	    return parseAssignExpression();
	}

	// foo = "bar"
	function parseAssignExpression() {
	    var exp = parseLogicalOrExpression();
	    if (at(T.EQUALS)) {
	    	var line = state.line;
	    	next();
	    	var root = new A.Assign(exp, parseLogicalOrExpression());
	    	var curr = root;
	    	while (at(T.EQUALS)) {
	    		line = state.line;
	    		next();
	    		curr.value = new A.Assign(curr.value, parseLogicalOrExpression());
	    		curr = curr.value;
	    		// TODO: line
	    	}
	    	return root;
	    } else {
	        return exp;
	    }
	}

	// a || b
	function parseLogicalOrExpression() {
	    var exp = parseLogicalAndExpression();
	    while (at(T.OR)) {
	    	var op = curr.binOp;
	    	next();
	    	exp = new op(exp, parseLogicalAndExpression());
	    	// TODO: line
	    }
	    return exp;
	}
	
	// a && b
	function parseLogicalAndExpression() {
	    var exp = parseBitwiseOrExpression();
	    while (at(T.AND)) {
	    	var op = curr.binOp;
	    	next();
	    	exp = new op(exp, parseBitwiseOrExpression());
	    	// TODO: line
	    }
	    return exp;
	}
	
	// a | b
	function parseBitwiseOrExpression() {
	    var exp = parseBitwiseXorExpression();
	    while (at(T.PIPE)) {
	    	var op = curr.binOp;
	    	next();
	    	exp = new op(exp, parseBitwiseXorExpression());
	    	// TODO: line
	    }
	    return exp;
	}
	
	// a ^ b
	function parseBitwiseXorExpression() {
	    var exp = parseBitwiseAndExpression();
	    while (at(T.HAT)) {
	    	var op = curr.binOp;
	    	next();
	    	exp = new op(exp, parseBitwiseAndExpression());
	    	// TODO: line
	    }
	    return exp;
	}
	
	// a & b
	function parseBitwiseAndExpression() {
	    var exp = parseEqualityExpression();
	    while (at(T.AMP)) {
	    	var op = curr.binOp;
	    	next();
	    	exp = new op(exp, parseEqualityExpression());
	    	// TODO: line
	    }
	    return exp;
	}
	
	// a == b, a != b
	function parseEqualityExpression() {
	    var exp = parseCmpExpression();
	    while (at(T.EQ) || at(T.NEQ)) {
	    	var op = curr.binOp;
	    	next();
	    	exp = new op(exp, parseCmpExpression());
	    	// TODO: line
	    }
	    return exp;
	}
	
	// a < b, a > b, a <= b, a >= b
	function parseCmpExpression() {
	    var exp = parseShiftExpression();
	    while (at(T.LT) || at(T.GT) || at(T.LE) || at(T.GE)) {
	    	var op = curr.binOp;
	    	next();
	    	exp = new op(exp, parseShiftExpression());
	    	// TODO: line
	    }
		return exp;
	}
	
	// a << b, a >> b
	function parseShiftExpression() {
	    var exp = parseAddSubExpression();
	    while (at(T.LSHIFT) || at(T.RSHIFT)) {
	    	var op = curr.binOp;
	    	next();
	    	exp = new op(exp, parseAddSubExpression());
	    	// TODO: line
	    }
	    return exp;
	}
	
	// a + b, a - b
	function parseAddSubExpression() {
	    var exp = parseMulDivPowModExpression();
	    while (at(T.PLUS) || at(T.MINUS)) {
	    	var op = curr.binOp;
	    	next();
	    	exp = new op(exp, parseMulDivPowModExpression());
	    	// TODO: line
	    }
	    return exp;
	}
	
	// a * b, a / b, a ** b, a % b
	function parseMulDivPowModExpression() {
	    var exp = parseUnary();
	    while (at(T.STAR) || at(T.SLASH) || at(T.BACKSLASH) || at(T.POW) || at(T.PERCENT)) {
	    	var op = curr.binOp;
	    	next();
	    	exp = new op(exp, parseUnary());
	    	// TODO: line
	    }
	    return exp;
	}
	
	// !foo, ~foo, -foo, +foo
	function parseUnary() {
	    if (at(T.BANG) || at(T.TILDE) || at(T.MINUS) || at(T.PLUS)) {
	        var line = state.line;
	        var op = curr.unOp;
	        var rootOp = new op(null);
	        var currentOp = rootOp;
	        next();
	        while (at(T.BANG) || at(T.TILDE) || at(T.MINUS) || at(T.PLUS)) {
	        	line = state.line;
	        	op = curr.unOp;
	        	currentOp.exp = new op(null);
	        	currentOp = currentOp.exp;
	        	next();
	        }
	        currentOp.exp = parseSpawn();
	        return rootOp;
	    } else {
	        return parseSpawn();
	    }
	}

	// function parseEval() {
	//     if (curr === 'EVAL') {
	//         var node = { type: A.EVAL, line: state.line };
	//         next();
	//         node.code = parseExpression();
	//         return node;
	//     } else {
	//         return parseSpawn();
	//     }
	// }

	function parseSpawn() {
	    if (curr === T.SPAWN) {
	        var line = state.line;
	        next();
	        var node = parseCall();
	        if (node.type !== A.CALL) {
	        	error("expected: function call (spawn)");
	        }
	        // just throw away the call
	        return new A.Spawn(node.callee, node.args);
	    } else {
	        return parseCall();
	    }
	}

	function parseCall() {

	    var lhs, callType;

	    // wait/eval are language-level function calls
	    // this is a horrible way to parse them but it makes it trivial to reuse
	    // the no-paren parsing logic
	    if (curr === 'WAIT' || curr === 'EVAL') {
	    	throw new Error("impl");
	        // callType = (curr === 'WAIT') ? A.WAIT : A.EVAL;
	        // next();
	        // if (curr !== '(') {
	        //     error("wait/eval must have function call", '(');
	        // }
	    } else {
	        callType = A.CALL;
	        lhs = parseAtom();
	    }

	    while (curr === T.LPAREN || curr === T.DOT || curr === T.LBRACKET) {
	        if (curr === T.LPAREN) {
	            if (callType !== A.CALL) {
	            	throw new Error("impl");
	                // lhs = {
	                //     type    : callType,
	                //     args    : parseParenArgs()
	                // };
	                // callType = A.CALL;
	            } else {
	            	lhs = new A.Call(lhs, parseParenArgs());
	            }
	        } else if (curr === '.') {
	        	throw new Error("impl");
	            // next();
	            // var name = state.text;
	            // accept('IDENT');
	            // lhs = {
	            //     type    : A.PROP_DEREF,
	            //     subject : lhs,
	            //     name    : name
	            // };
	        } else {
	        	throw new Error("impl");
	            // next();
	            // lhs = {
	            //     type    : A.ARRAY_DEREF,
	            //     subject : lhs,
	            //     index   : parseExpression()
	            // };
	            // accept(']');
	        }
	    }
	    return lhs;
	}

	function parseAtom() {
	    var exp = null, line = state.line;

	    if (at(T.TRUE)) {
	        exp = new A.Literal(true);
	        next();
	    } else if (at(T.FALSE)) {
	        exp = new A.Literal(false);
	        next();
	    } else if (at(T.INTEGER)) {
	    	exp = new A.Literal(parseInt(text(), 10));
	        next();
	    } else if (at(T.HEX)) {
	    	exp = new A.Literal(parseInt(text().substring(2), 16));
	        next();
	    } else if (at(T.BINARY)) {
	    	exp = new A.Literal(parseInt(text().substring(2), 2));
	        next();
	    } else if (at(T.FLOAT)) {
	    	exp = new A.Literal(parseFloat(text()), 10);
	        next();
	    } else if (at(T.STRING)) {
	    	exp = new A.Literal(decodeString(state.text));
	        next();
	    // } else if (at('TRACE')) {
	    //     exp = { type: A.TRACE };
	    //     next();
	    } else if (at(T.IDENT)) {
	        exp = parseIdent();
	    } else if (at(T.GLOBAL_IDENT)) {
	    	exp = new A.GlobalIdent(state.text.substring(1));
	        next();
	    // } else if (at('$')) {
	    //     exp = { type: A.GLOBAL_OBJECT };
	    //     next();
	    // } else if (at('COLOR')) {
	    //     exp = decodeColor(text());
	    //     next();
	    // } else if (at('#')) {
	    //     exp = { type: A.COLOR_CTOR };
	    //     next();
	    //     exp.args = parseParenArgs();
	    } else if (at('?')) {
	        exp = { type: A.MISSING_ARG, line: line };
	        next();
	    } else if (at(T.LPAREN)) {
	        next();
	        exp = parseExpression();
	        accept(T.RPAREN);
	    } else if (at(T.LBRACKET)) {
	    	exp = parseArray();
	    // } else if (at('[')) {
	    //     exp = parseArray();
	    // } else if (at('{')) {
	    //     exp = parseDictionary();
	    } else if (at(T.DOTBRACE)) {
	        exp = parseLambda();
	    } else {
	        error("expected: expression");
	    }

	    return exp;
	}

	function parseIdent() {
		var ident = new A.Ident(state.text);
	    accept(T.IDENT);
	    return ident;
	}
	
	function parseParenArgs() {
	    var args = [];
	    accept(T.LPAREN);
	    while (curr !== T.RPAREN) {
	        args.push(parseExpression());
	        if (curr === T.COMMA) {
	            next();
	        } else {
	            break;
	        }
	    }
	    accept(T.RPAREN);
	    return args;
	}

	function parseArray() {
		var els = [], line = state.line;
		accept(T.LBRACKET);
		skipNewlines();
		if (curr !== T.RBRACKET) {
		    while (true) {
		        els.push(parseExpression());
		        skipNewlines();
		        if (curr === T.COMMA) {
		            next();
		            skipNewlines();
		        } else {
		            break;
		        }
		    }    
		}
		accept(T.RBRACKET);
		return new A.ArrayLiteral(els);
	}

	function parseLambda() {
	    
	    var line        = state.line,
	        hasParams  	= false;
	    
	    accept(T.DOTBRACE);

	    if (curr === T.IDENT) {
	        var lookahead = lexer.clone(state);
	        while (true) {
	            var tok = lexer.lex(lookahead);
	            if (tok === T.IDENT || tok === T.COMMA) {
	                // do nothing
	            } else if (tok === T.PIPE) {
	                hasParams = true;
	                break;
	            } else {
	                break;
	            }
	        }
	    }

	    var params = hasParams ? parseLambdaParameters() : [];
	    var body = parseStatements();

	    accept(T.RBRACE);

	    return new A.Lambda(params, body);

	}

	function parseLambdaParameters() {
	    var args = [{ name: state.text, optional: false, defaultValue: void 0 }];
	    accept(T.IDENT);
		while (true) {
	        if (at(T.COMMA)) {
	            next();
	            args.push({ name: requireident(), optional: false, defaultValue: void 0 });
	        } else if (at(T.PIPE)) {
	            next();
	            return args;
	        } else {
	            error("unexpected token in lambda argument list")
	        }
	    }
	}

	return {
		parseModule: function(source) {
			reset(source);
			return parseModule();
		}
	};

}



// var parser = 

// var state = lexer.start('\r\n\n&& "this is a string" .{x,y|0b1101return 0xff0 ==foo if while 2 + 5 <= 100 ** 20.123 { [] } yield 20');
// var token;

// var T = require('./v4/tokens');

// function cont(t) {
// 	return t !== T.EOF && t !== T.ERROR;
// }

// while (cont(token = lexer.lex(state))) {
// 	console.log(token);
// }

// if (state.error) {
// 	console.log(state.error);
// }