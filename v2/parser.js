"use strict";

var L           = require('./lexer'),
    A           = require('./ast_nodes'),
    COLORS      = require('./colors'),
    ParseError  = require('./parse_error');

// Issues with the current version of the parser:
//
// 1) no-paren function calls are unimplemented
//
// 2) no-paren function calls cannot support literal array as first argument;
// i.e. "foo [1]" is parsed as an indexing operation on 'foo'... to allow this
// we'd need to distinguish between "[" and " [" in the lexer (like with the
// COMPOSE operator) and shove a bunch of special cases in the parser. not pretty
// but it'll work fine.

// exhaustive list of tokens that can follow an identifier
// to allow a function call without parens.
var EXP_START_TOKENS = {
    '!'             : true,
    '~'             : true,
    '.{'            : true,
    '{'             : true,
    '#'             : true,
    '$'             : true,
    'TRUE'          : true,
    'FALSE'         : true,
    'INTEGER'       : true,
    'HEX'           : true,
    'BINARY'        : true,
    'FLOAT'         : true,
    'STRING'        : true,
    'TRACE'         : true,
    'IDENT'         : true,
    'GLOBAL_IDENT'  : true,
    'COLOR'         : true
};

module.exports = function(input) {

    var lexer   = L(),
        state   = lexer.start(input),
        curr    = null;

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
        if (curr === 'ERROR') {
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
        if (curr !== 'IDENT')
            noident();
    }

    function noident() {
        error('expected identifier', 'IDENT');
    }

    function atBlockStatementStart() {
        return curr === 'IF'
                || curr === 'WHILE'
                || curr === 'LOOP'
                || curr === 'FOREACH'
                || curr === 'DEF';
    }

    function eof() {
        return curr === 'EOF';
    }

    function atBlockTerminator() {
        return curr === '}';
    }

    function atStatementTerminator() {
        return curr === ';' || curr === 'NL';
    }

    function skipNewlines() {
        while (curr === 'NL')
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

    function decodeColor(text) {
        var resolved    = COLORS[text.substring(1).replace(/_/g, '').toLowerCase()],
            hex         = resolved || text,
            matches     = null;
        
        if (matches = hex.match(/^#([0-9a-z]{2})([0-9a-z]{2})([0-9a-z]{2})([0-9a-z]{2})?$/i)) {
            return {
                type  : A.COLOR,
                r     : parseInt(matches[1], 16),
                g     : parseInt(matches[2], 16),
                b     : parseInt(matches[3], 16),
                a     : (typeof matches[4] === 'string') ? parseInt(matches[4], 16) : 255
            };
        } else {
            error("Invalid color literal '" + text + "'. Color literals must be 6/8 character hex strings, or valid color names.");
        }
    }

    //
    //

    function parseModule() {

        var program = { type: A.MODULE, body: [] };

        next();
        skipNewlines();

        program.ports = parsePorts();
        program.body = parseStatements();

        accept('EOF');

        return program;

    }

    // Such import! So module! Much wtf!
    //
    // import foo
    // import "foo"
    // import foo as f
    // import foo {alpha, beta, gamma}
    // import foo {alpha as a, beta as b, gamma as c}
    // import foo {alpha as a, beta as b, gamma as c} as f
    // import! foo
    // import! foo {alpha, beta}
    // import! foo {alpha as a, beta as b}
    // export foo
    // export foo as f
    // export foo, bar
    // export foo as f, bar as b
    // export! foo
    function parsePorts() {
        var ports = [];
        while (true) {
            if (curr === 'IMPORT' || curr === 'IMPORT!') {
                var node = {
                    type    : A.IMPORT,
                    bang    : curr === 'IMPORT!',
                    line    : state.line,
                    module  : null,
                    alias   : null,
                    imports : null
                };
                next();
                if (curr === 'IDENT') {
                    node.module = parseIdent();
                } else if (curr === 'STRING') {
                    node.module = parseString();
                } else {
                    error("expected module identifier or string");
                }
                if (curr === '{') {
                    next();
                    node.imports = {};
                    while (true) {
                        requireident();
                        var ident = state.text,
                            alias = ident;
                        next();
                        if (curr === 'AS') {
                            next();
                            requireident();
                            alias = state.text;
                            next();
                        }
                        node.imports[ident] = alias;
                        if (curr === ',') {
                            next();
                        } else {
                            break;
                        }
                    }
                    accept('}');
                }
                if (curr === 'AS') {
                    if (node.bang) {
                        error("bang-imported modules cannot be aliased");
                    }
                    next();
                    requireident();
                    node.alias = state.text;
                    next();
                }
                ports.push(node);
            } else if (curr === 'EXPORT') {
                var node = {
                    type    : A.EXPORT,
                    bang    : false,
                    line    : state.line,
                    exports : {}
                };
                next();
                while (true) {
                    requireident();
                    var ident = state.text,
                        alias = ident;
                    next();
                    if (curr === 'AS') {
                        next();
                        requireident();
                        alias = state.text;
                        next();
                    }
                    node.exports[ident] = alias;
                    if (curr === ',') {
                        next();
                    } else {
                        break;
                    }
                }
                ports.push(node);
            } else if (curr === 'EXPORT!') {
                var node = {
                    type    : A.EXPORT,
                    bang    : true,
                    line    : state.line,
                    exports : null
                };
                next();
                requireident();
                node.exports = state.text;
                next();
                ports.push(node);
            } else {
                break;
            }
            accept('NL');
            skipNewlines();
        }
        return ports;
    }

    function parseBlock() {
        accept('{');
        var statements = parseStatements();
        accept('}');
        return statements;
    }

    function parseStatements() {
        
        var statements = [];

        skipStatementTerminators();

        while (!atBlockTerminator() && !eof()) {
            if (atBlockStatementStart()) {
                statements.push(parseBlockStatement());
                skipStatementTerminators();
            } else {
                statements.push(parseInlineStatement());
                if (atStatementTerminator()) {
                    skipStatementTerminators();
                } else {
                    break;
                }
            }
        }

        return statements;

    }

    function parseBlockStatement() {
        if (curr === 'WHILE') {
            return parseWhileStatement();
        } else if (curr === 'LOOP') {
            return parseLoopStatement();
        } else if (curr === 'FOREACH') {
            return parseForeachStatement();
        } else if (curr === 'IF') {
            return parseIfStatement();
        } else if (curr === 'DEF') {
            return parseFunctionDefinition();
        } else {
            error("expected 'while', 'loop'");
        }
    }

    function parseInlineStatement() {
        if (curr === 'RETURN') {
            return parseReturnStatement();
        } else if (curr === 'YIELD') {
            return parseYieldStatement();
        } else if (curr === 'MY') {
            return parseLocalVariables();
        } else {
            return parseExpression();
        }
    }

    function parseWhileStatement() {
        var line = state.line;
        accept('WHILE');
        var node = { type: A.WHILE, line: line };
        node.condition = parseExpression();
        skipNewlines();
        node.body = parseBlock();
        return node;
    }

    function parseLoopStatement() {
        var line = state.line;
        accept('LOOP');
        var node = { type: A.LOOP, line: line };
        if (at('WHILE')) {
            next();
            node.condition = parseExpression();
        } else {
            node.condition = true;
        }
        skipNewlines();
        node.body = parseBlock();
        return node;
    }

    function parseForeachStatement() {
        
        var node    = { type: A.FOREACH, line: state.line },
            i1      = null,
            i2      = null;

        accept('FOREACH');

        requireident();

        i1 = state.text;
        next();

        if (curr === ',') {
            next();
            requireident();
            i2 = state.text;
            next();
        }

        if (i2) {
            node.index = i1;
            node.value = i2;
        } else {
            node.index = null;
            node.value = i1;
        }

        accept('IN');
        node.exp = parseExpression();

        skipNewlines();
        node.body = parseBlock();

        return node;

    }

    function parseIfStatement() {

        var node = { type: A.IF, conditions: [], bodies: [], line: state.line };

        accept('IF');

        node.conditions.push(parseExpression());
        skipNewlines();
        node.bodies.push(parseBlock());
        skipNewlines();

        while (curr === 'ELSE') {
            next();
            if (curr === 'IF') {
                next();
                node.conditions.push(parseExpression());
                skipNewlines();
                node.bodies.push(parseBlock());
                skipNewlines();
            } else {
                skipNewlines();
                node.conditions.push(null);
                node.bodies.push(parseBlock());
                skipNewlines();
                break;
            }
        }

        return node;

    }

    function parseFunctionDefinition() {

        var node = { type: A.DEF };

        accept('DEF');

        requireident();

        node.name = state.text;
        next();

        if (curr === '(') {
            next();
            node.params = parseFunctionParameters();
            accept(')');
        } else {
            node.params = [];
        }

        skipNewlines();
        node.body = parseBlock();

        return node;

    }

    function parseFunctionParameters() {
        var params = [], optional = false;
        while (curr === 'IDENT') {
            var param = {name: state.text, optional: false};
            next();
            if (curr === '=') {
                next();
                param.optional = true;
                // FIXME: shouldn't be allowing full expressions in here
                param.defaultValue = parseExpression();
                optional = true;
            } else if (optional) {
                error("required parameters cannot follow optional parameters");
            }
            params.push(param);
            if (curr === ',') {
                next();
            } else {
                break;
            }
        }
        return params;
    }

    function parseReturnStatement() {
        var node = { type: A.RETURN, exp: null, line: state.line };
        accept('RETURN');
        if (eof() || atBlockTerminator() || atStatementTerminator()) {
            // do nothing
        } else {
            node.exp = parseExpression();
        }
        return node;
    }

    function parseYieldStatement() {
        var node = { type: A.YIELD, line: state.line };
        accept('YIELD');
        return node;
    }

    function parseLocalVariables() {
        var node = { type: A.LOCALS, line: state.line, names: [], values: [] };
        next();
        while (true) {
            requireident();
            node.names.push(state.text);
            next();
            if (curr === '=') {
                next();
                node.values.push(parseExpression());
            } else {
                node.values.push(null);
            }
            if (curr === ',') {
                next();
            } else {
                break;
            }
        }
        return node;
    }
    
    function parseExpression() {
        return parseAssignExpression();
    }
    
    // foo = "bar"
    function parseAssignExpression() {
        var exp = parseLogicalOrExpression();
        if (at('=')) {
            var line = state.line;
            next();
            var root = { type: A.ASSIGN, line: line, left: exp, right: parseLogicalOrExpression() }, curr = root;
            while (at('=')) {
                line = state.line;
                next();
                curr.right = { type: A.ASSIGN, line: line, left: curr.right, right: parseLogicalOrExpression() };
                curr = curr.right;
            }
            return root;
        } else {
            return exp;
        }
    }
    
    // a || b
    function parseLogicalOrExpression() {
        var exp = parseLogicalAndExpression();
        while (at('||')) {
            var line = state.line;
            next();
            exp = { type: A.BIN_OP, op: '||', line: line, left: exp, right: parseLogicalAndExpression() };
        }
        return exp;
    }
    
    // a && b
    function parseLogicalAndExpression() {
        var exp = parseBitwiseOrExpression();
        while (at('&&')) {
            var line = state.line;
            next();
            exp = { type: A.BIN_OP, op: '&&', line: line, left: exp, right: parseBitwiseOrExpression() };
        }
        return exp;
    }
    
    // a | b
    function parseBitwiseOrExpression() {
        var exp = parseBitwiseXorExpression();
        while (at('|')) {
            var line = state.line;
            next();
            exp = { type: A.BIN_OP, op: '|', line: line, left: exp, right: parseBitwiseXorExpression() };
        }
        return exp;
    }
    
    // a ^ b
    function parseBitwiseXorExpression() {
        var exp = parseBitwiseAndExpression();
        while (at('^')) {
            var line = state.line;
            next();
            exp = { type: A.BIN_OP, op: '^', line: line, left: exp, right: parseBitwiseAndExpression() };
        }
        return exp;
    }
    
    // a & b
    function parseBitwiseAndExpression() {
        var exp = parseEqualityExpression();
        while (at('&')) {
            var line = state.line;
            next();
            exp = { type: A.BIN_OP, op: '&', line: line, left: exp, right: parseEqualityExpression() };
        }
        return exp;
    }
    
    // a == b, a != b
    function parseEqualityExpression() {
        var exp = parseCmpExpression();
        while (at('==') || at('!=')) {
            var line = state.line, op = curr;
            next();
            exp = { type: A.BIN_OP, op: op, line: line, left: exp, right: parseCmpExpression() };
        }
        return exp;
    }
    
    // a < b, a > b, a <= b, a >= b
    function parseCmpExpression() {
        var exp = parseShiftExpression();
        while (at('<') || at('>') || at('<=') || at('>=')) {
            var line = state.line, op = curr;
            next();
            exp = { type: A.BIN_OP, op: op, line: line, left: exp, right: parseShiftExpression() };
        }
        return exp;
    }
    
    // a << b, a >> b
    function parseShiftExpression() {
        var exp = parseAddSubExpression();
        while (at('<<') || at('>>')) {
            var line = state.line, op = curr;
            next();
            exp = { type: A.BIN_OP, op: op, line: line, left: exp, right: parseAddSubExpression() };
        }
        return exp;
    }
    
    // a + b, a - b
    function parseAddSubExpression() {
        var exp = parseMulDivPowModExpression();
        while (at('+') || at('-')) {
            var line = state.line, op = curr;
            next();
            exp = { type: A.BIN_OP, op: op, line: line, left: exp, right: parseMulDivPowModExpression() };
        }
        return exp;
    }
    
    // a * b, a / b, a ** b, a % b
    function parseMulDivPowModExpression() {
        var exp = parseUnary();
        while (at('*') || at('/') || at('**') || at('%')) {
            var line = state.line, op = curr;
            next();
            exp = { type: A.BIN_OP, op: op, line: line, left: exp, right: parseUnary() };
        }
        return exp;
    }
    
    // !foo, ~foo, -foo, +foo
    function parseUnary() {
        if (at('!') || at('~') || at('-') || at('+')) {
            var line = state.line;
            var root = { type: A.UN_OP, op: curr, line: line, exp: null }, curr = root;
            next();
            while (at('!') || at('~') || at('-') || at('+')) {
                line = state.line;
                curr.exp = { type: A.UN_OP, op: curr, line: line, exp: null };
                curr = curr.exp;
                next();
            }
            curr.exp = parseSpawn();
            return root;
        } else {
            return parseSpawn();
        }
    }

    function parseEval() {
        if (curr === 'EVAL') {
            var node = { type: A.EVAL, line: state.line };
            next();
            node.code = parseExpression();
            return node;
        } else {
            return parseSpawn();
        }
    }

    function parseSpawn() {
        if (curr === 'SPAWN') {
            var line = state.line;
            next();
            var node = parseCall();
            if (node.type !== A.CALL) {
                error("expected: function call (spawn)");
            }
            node.type = A.SPAWN;
            return node;
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
            callType = (curr === 'WAIT') ? A.WAIT : A.EVAL;
            next();
            if (curr !== '(') {
                error("wait/eval must have function call", '(');
            }
        } else {
            callType = A.CALL;
            lhs = parseAtom();
        }

        while (curr === '(' || curr === '.' || curr === '[') {
            if (curr === '(') {
                if (callType !== A.CALL) {
                    lhs = {
                        type    : callType,
                        args    : parseParenArgs()
                    };
                    callType = A.CALL;
                } else {
                    lhs = {
                        type    : A.CALL,
                        fn      : lhs,
                        args    : parseParenArgs()
                    };
                }
            } else if (curr === '.') {
                next();
                var name = state.text;
                accept('IDENT');
                lhs = {
                    type    : A.PROP_DEREF,
                    subject : lhs,
                    name    : name
                };
            } else {
                next();
                lhs = {
                    type    : A.ARRAY_DEREF,
                    subject : lhs,
                    index   : parseExpression()
                };
                accept(']');
            }
        }
        return lhs;
    }

    function parseAtom() {
        var exp = null, line = state.line;

        if (at('TRUE')) {
            exp = true;
            next();
        } else if (at('FALSE')) {
            exp = false;
            next();
        } else if (at('INTEGER')) {
            exp = {
                type: A.INTEGER,
                value: parseInt(text(), 10)
            };
            next();
        } else if (at('HEX')) {
            exp = {
                type: A.INTEGER,
                value: parseInt(text().substring(2), 16)
            };
            next();
        } else if (at('BINARY')) {
            exp = {
                type: A.INTEGER,
                value: parseInt(text().substring(2), 2)
            };
            next();
        } else if (at('FLOAT')) {
            exp = {
                type: A.FLOAT,
                value: parseFloat(text(), 10)
            };
            next();
        } else if (at('STRING')) {
            exp = parseString();
        } else if (at('TRACE')) {
            exp = { type: A.TRACE };
            next();
        } else if (at('IDENT')) {
            exp = parseIdent();
        } else if (at('GLOBAL_IDENT')) {
            exp = {
                type: A.GLOBAL_IDENT,
                name: text().substring(1)
            };
            next();
        } else if (at('$')) {
            exp = { type: A.GLOBAL_OBJECT };
            next();
        } else if (at('COLOR')) {
            exp = decodeColor(text());
            next();
        } else if (at('#')) {
            exp = { type: A.COLOR_CTOR };
            next();
            exp.args = parseParenArgs();
        } else if (at('?')) {
            exp = { type: A.MISSING_ARG, line: line };
            next();
        } else if (at('(')) {
            next();
            exp = parseExpression();
            accept(')');
        } else if (at('[')) {
            exp = parseArray();
        } else if (at('{')) {
            exp = parseDictionary();
        } else if (at('.{')) {
            exp = parseLambda();
        } else {
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
        var exp = { type: A.IDENT, name: state.text };
        accept('IDENT');
        return exp;
    }
    
    function parseParenArgs() {
        var args = [];
        accept('(');
        while (curr !== ')') {
            args.push(parseExpression());
            if (curr === ',') {
                next();
            } else {
                break;
            }
        }
        accept(')');
        return args;
    }

    function parseArray() {
        var els = [], line = state.line;
        accept('[');
        if (curr !== ']') {
            while (true) {
                els.push(parseExpression());
                if (curr === ',') {
                    next();
                } else {
                    break;
                }
            }    
        }
        accept(']');
        return { type: A.ARRAY, elements: els, line: line };
    }

    function parseDictionary() {
        var pairs = [], line = state.line;
        accept('{');
        if (curr !== '}') {
            while (true) {
                if (curr === 'STRING') {
                    pairs.push(decodeString(state.text));
                } else if (curr === 'IDENT') {
                    pairs.push(state.text);
                } else {
                    error("dictionary key must be either string or identifier");
                }
                next();
                accept('=');
                pairs.push(parseExpression());
                if (curr === ',') {
                    next();
                } else {
                    break;
                }
            }
        }
        accept('}');
        return { type: A.DICT, pairs: pairs, line: line };
    }

    function parseLambda() {
        
        var line        = state.line,
            hasArgList  = false;
        
        accept('.{');

        if (curr === 'IDENT') {
            var lookahead = lexer.clone(state);
            while (true) {
                var tok = lexer.lex(lookahead);
                if (tok === 'IDENT' || tok === ',') {
                    // do nothing
                } else if (tok === '|') {
                    hasArgList = true;
                    break;
                } else {
                    break;
                }
            }
        }

        var exp = {
            type: A.LAMBDA,
            args: hasArgList ? parseLambdaArgs() : [],
            body: parseStatements()
        };

        accept('}');

        return exp;

    }

    function parseLambdaArgs() {
        
        var args = [state.text];
        accept('IDENT');

        while (true) {
            if (at(',')) {
                next();
                args.push(state.text);
                accept('IDENT');
            } else if (at('|')) {
                next();
                return args;
            } else {
                error("unexpected token in lambda argument list")
            }
        }

    }

    return {
        parseModule         : parseModule
    };

}