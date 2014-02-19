"use strict";

var L           = require('./lexer'),
    A           = require('./ast_nodes'),
    COLORS      = require('./colors'),
    ParseError  = require('./parse_error');

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
    // import foo.{alpha, beta, gamma}
    // import foo.{alpha as a, beta as b, gamma as c}
    // import foo.{alpha as a, beta as b, gamma as c} as f
    // import! foo
    // import! foo.{alpha, beta}
    // import! foo.{alpha as a, beta as b}
    // export foo
    // export foo as f
    // export foo, bar
    // export foo as f, bar as b
    // export! foo
    // export! foo.bar
    // export! foo[0]
    function parsePorts() {
        var ports = [];
        while (true) {
            if (curr === 'IMPORT' || curr === 'IMPORT!') {
                var node = {
                    type    : A.IMPORT,
                    bang    : curr === 'IMPORT!',
                    line    : state.line,
                    alias   : null,
                    imports : null
                };
                next();
                if (curr !== 'IDENT' && curr !== 'STRING') {
                    error("expected module identifier or string");
                }
                node.module = parseExpression();
                if (curr === '.') {
                    next();
                    accept('{');
                    node.imports = {};
                    while (true) {
                        if (curr !== 'IDENT') {
                            error("expected identifier");
                        }
                        var ident = state.text,
                            alias = ident;
                        next();
                        if (curr === 'AS') {
                            next();
                            if (curr !== 'IDENT') {
                                error("expected: identifier");
                            }
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
                    if (curr !== 'IDENT') {
                        error("expected identifier");
                    }
                    node.alias = state.text;
                    next();
                }
                ports.push(node);
            } else if (curr === 'EXPORT') {
                var node = {
                    type    : A.EXPORT,
                    bang    : false,
                    line    : state.line,
                    symbols : []
                };
                next();
                if (curr !== 'IDENT') {
                    error("expected identifier");
                }
                while (curr === 'IDENT') {
                    symbols.push(state.text);
                    next();
                    if (curr === ',') {
                        next();
                    } else {
                        break;
                    }
                }
            } else if (curr === 'EXPORT!') {
                var node = {
                    type    : A.EXPORT,
                    bang    : true,
                    line    : state.line,
                    symbols : []
                };
                next();
                if (curr !== 'IDENT') {
                    error("expected identifier");
                }
                node.symbols.push(state.text);
                next();
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

        if (curr !== 'IDENT') {
            error("expected identifier", 'IDENT');
        }

        i1 = state.text;
        next();

        if (curr === ',') {
            next();
            if (curr !== 'IDENT') {
                error("expected identifier", 'IDENT');
            }
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

        if (curr !== 'IDENT') {
            error("expected identifier", 'IDENT');
        }

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
            curr.exp = parseEval();
            return root;
        } else {
            return parseEval();
        }
    }

    function parseEval() {
        if (curr === 'EVAL') {
            var node = { type: A.EVAL, line: state.line };
            next();
            node.code = parseExpression();
            return node;
        } else {
            return parseCall();
        }
    }

    function parseCall() {
        var lhs = parseAtom();
        while (curr === '(' || curr === '.' || curr === '[') {
            if (curr === '(') {
                lhs = {
                    type    : A.CALL,
                    fn      : lhs,
                    args    : parseParenArgs()
                };
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
            exp = {
                type: A.STRING,
                value: decodeString(text())
            };
            next();
        } else if (at('TRACE')) {
            exp = { type: A.TRACE };
            next();
        } else if (at('IDENT')) {
            exp = {
                type: A.IDENT,
                name: text()
            };
            next();
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
        } else if (at('.{')) {
            exp = parseLambda();
        } else {
            error("expected: expression");
        }

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