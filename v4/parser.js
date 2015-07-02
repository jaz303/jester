"use strict";

module.exports = create;

var A 			= require('./ast');
var L 			= require('./lexer');
var T 			= require('./tokens');
var ParseError 	= require('./ParseError');

function create(source) {

	var lexer	= L();
	var state	= lexer.start(source);
	var curr	= null;

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
	}

	function noident() {
	    error('expected identifier', T.IDENT);
	}

	function atBlockStatementStart() {
		return false;
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
	//

	function parseModule() {
		next();
		skipNewlines();
		var stmts = parseStatements();
		accept(T.EOF);
		return new A.Module(new A.Block(stmts));
	}

	function parseBlock() {
		accept(T.LBRACE);
		var block = new A.Block(parseStatements());
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
		return stmts;
	}

	function parseBlockStatement() {
		// nothing to do
	}

	function parseInlineStatement() {
		return parseExpression();
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
	    	}
	    	return root;
	    	// throw new Error("impl");
	     //    // var line = state.line;
	     //    // next();
	     //    // var root = { type: A.ASSIGN, line: line, left: exp, right:  }, curr = root;
	     //    // while (at('=')) {
	     //    //     line = state.line;
	     //    //     next();
	     //    //     curr.right = { type: A.ASSIGN, line: line, left: curr.right, right:  };
	     //    //     curr = curr.right;
	     //    // }
	     //    // return root;
	    } else {
	        return exp;
	    }
	}

	// a || b
	function parseLogicalOrExpression() {
	    var exp = parseLogicalAndExpression();
	    while (at('||')) {
	    	throw new Error("impl");
	        // var line = state.line;
	        // next();
	        // exp = { type: A.BIN_OP, op: '||', line: line, left: exp, right: parseLogicalAndExpression() };
	    }
	    return exp;
	}
	
	// a && b
	function parseLogicalAndExpression() {
	    var exp = parseBitwiseOrExpression();
	    while (at('&&')) {
	    	throw new Error("impl");
	        // var line = state.line;
	        // next();
	        // exp = { type: A.BIN_OP, op: '&&', line: line, left: exp, right: parseBitwiseOrExpression() };
	    }
	    return exp;
	}
	
	// a | b
	function parseBitwiseOrExpression() {
	    var exp = parseBitwiseXorExpression();
	    while (at('|')) {
	    	throw new Error("impl");
	        // var line = state.line;
	        // next();
	        // exp = { type: A.BIN_OP, op: '|', line: line, left: exp, right: parseBitwiseXorExpression() };
	    }
	    return exp;
	}
	
	// a ^ b
	function parseBitwiseXorExpression() {
	    var exp = parseBitwiseAndExpression();
	    while (at('^')) {
	    	throw new Error("impl");
	        // var line = state.line;
	        // next();
	        // exp = { type: A.BIN_OP, op: '^', line: line, left: exp, right: parseBitwiseAndExpression() };
	    }
	    return exp;
	}
	
	// a & b
	function parseBitwiseAndExpression() {
	    var exp = parseEqualityExpression();
	    while (at('&')) {
	    	throw new Error("impl");
	        // var line = state.line;
	        // next();
	        // exp = { type: A.BIN_OP, op: '&', line: line, left: exp, right: parseEqualityExpression() };
	    }
	    return exp;
	}
	
	// a == b, a != b
	function parseEqualityExpression() {
	    var exp = parseCmpExpression();
	    while (at('==') || at('!=')) {
	    	throw new Error("impl");
	        // var line = state.line, op = curr;
	        // next();
	        // exp = { type: A.BIN_OP, op: op, line: line, left: exp, right: parseCmpExpression() };
	    }
	    return exp;
	}
	
	// a < b, a > b, a <= b, a >= b
	function parseCmpExpression() {
	    var exp = parseShiftExpression();
	    while (at('<') || at('>') || at('<=') || at('>=')) {
	    	throw new Error("impl");
	        // var line = state.line, op = curr;
	        // next();
	        // exp = { type: A.BIN_OP, op: op, line: line, left: exp, right: parseShiftExpression() };
	    }
	    return exp;
	}
	
	// a << b, a >> b
	function parseShiftExpression() {
	    var exp = parseAddSubExpression();
	    while (at('<<') || at('>>')) {
	    	throw new Error("impl");
	        // var line = state.line, op = curr;
	        // next();
	        // exp = { type: A.BIN_OP, op: op, line: line, left: exp, right: parseAddSubExpression() };
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
	    	throw new Error("impl");
	        // var line = state.line, op = curr;
	        // next();
	        // exp = { type: A.BIN_OP, op: op, line: line, left: exp, right: parseUnary() };
	    }
	    return exp;
	}
	
	// !foo, ~foo, -foo, +foo
	function parseUnary() {
	    if (at('!') || at('~') || at('-') || at('+')) {
	    	throw new Error("impl");
	        // var line = state.line;
	        // var root = { type: A.UN_OP, op: curr, line: line, exp: null }, curr = root;
	        // next();
	        // while (at('!') || at('~') || at('-') || at('+')) {
	        //     line = state.line;
	        //     curr.exp = { type: A.UN_OP, op: curr, line: line, exp: null };
	        //     curr = curr.exp;
	        //     next();
	        // }
	        // curr.exp = parseSpawn();
	        // return root;
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
	        // var line = state.line;
	        // next();
	        // var node = parseCall();
	        // if (node.type !== A.CALL) {
	        //     error("expected: function call (spawn)");
	        // }
	        // node.type = A.SPAWN;
	        // return node;
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
	        exp = parseString();
	    // } else if (at('TRACE')) {
	    //     exp = { type: A.TRACE };
	    //     next();
	    } else if (at(T.IDENT)) {
	        exp = parseIdent();
	    // } else if (at(T.GLOBAL_IDENT)) {
	    //     exp = {
	    //         type: A.GLOBAL_IDENT,
	    //         name: text().substring(1)
	    //     };
	    //     next();
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
	    // } else if (at('[')) {
	    //     exp = parseArray();
	    // } else if (at('{')) {
	    //     exp = parseDictionary();
	    // } else if (at('.{')) {
	    //     exp = parseLambda();
	    // } else {
	        error("expected: expression");
	    }

	    return exp;
	}

	function parseString() {
	    var exp = { type: A.STRING, value: decodeString(state.text) };
	    accept('STRING');
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



	return {
		parseModule: parseModule
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