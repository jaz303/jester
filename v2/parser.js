var A           = require('./ast_nodes'),
    COLORS      = require('./colors'),
    ParseError  = require('./parse_error');

module.exports = function(lexer) {

    //
    // helpers

    var curr = null;

    function next() {
        curr = lexer.lex();
        return curr;
    }

    function text() {
        return lexer.text();
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
            lexer.line(),
            lexer.column(),
            expectedToken || '<unknown>',
            curr
        );
    }

    function atBlockTerminator() {
        return curr === R_BRACE;
    }

    function atStatementTerminator() {
        return curr === 'SEMICOLON' || curr === 'NL';
    }

    function skipNewlines() {
        while (curr === 'NL')
            next();
    }

    function skipStatementTerminators() {
        while (atStatementTerminator())
            next();
    }

    function eos() {
        if (atStatementTerminator()) {
            next();
            skipStatementTerminators();
        } else {
            error("expected: end-of-statement (newline or semicolon)");
        }
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
        program.body = parseStatements();

        accept('EOF');

        return program;

    }

    function parseStatementBlock() {
        accept('L_BRACE');
        var statements = parseStatements();
        accept('R_BRACE');
        return statements;
    }

    function parseStatements() {
        var statements = [];
        skipStatementTerminators();
        while (curr !== 'EOF' && curr !== 'R_BRACE') {
            statements.push(parseStatement());
        }
        return statements;
    }

    function parseStatement() {
        if (curr === 'WHILE') {
            return parseWhileStatement();
        } else if (curr === 'LOOP') {
            return parseLoopStatement();
        } else {
            var stmt = parseExpression();
            eos();
            return stmt;
        }
    }

    function parseWhileStatement() {
        var line = lexer.line();
        accept('WHILE');
        var node = { type: A.WHILE, line: line };
        node.condition = parseExpression();
        skipNewlines();
        node.body = parseStatementBlock();
        return node;
    }

    function parseLoopStatement() {
        var line = lexer.line();
        accept('LOOP');
        var node = { type: A.LOOP, line: line };
        if (at('WHILE')) {
            next();
            node.condition = parseExpression();
        } else {
            node.condition = true;
        }
        skipNewlines();
        node.body = parseStatementBlock();
        return node;
    }
    
    function parseExpression() {
        return parseAssignExpression();
    }
    
    // foo = "bar"
    function parseAssignExpression() {
        var exp = parseLogicalOrExpression();
        if (at('ASSIGN')) {
            var line = lexer.line();
            next();
            var root = { type: A.ASSIGN, line: line, left: exp, right: parseLogicalOrExpression() }, curr = root;
            while (at('ASSIGN')) {
                line = lexer.line();
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
        while (at('L_OR')) {
            var line = lexer.line();
            next();
            exp = { type: A.BIN_OP, op: 'L_OR', line: line, left: exp, right: parseLogicalAndExpression() };
        }
        return exp;
    }
    
    // a && b
    function parseLogicalAndExpression() {
        var exp = parseBitwiseOrExpression();
        while (at('L_AND')) {
            var line = lexer.line();
            next();
            exp = { type: A.BIN_OP, op: 'L_AND', line: line, left: exp, right: parseBitwiseOrExpression() };
        }
        return exp;
    }
    
    // a | b
    function parseBitwiseOrExpression() {
        var exp = parseBitwiseXorExpression();
        while (at('PIPE')) {
            var line = lexer.line();
            next();
            exp = { type: A.BIN_OP, op: 'PIPE', line: line, left: exp, right: parseBitwiseXorExpression() };
        }
        return exp;
    }
    
    // a ^ b
    function parseBitwiseXorExpression() {
        var exp = parseBitwiseAndExpression();
        while (at('HAT')) {
            var line = lexer.line();
            next();
            exp = { type: A.BIN_OP, op: 'HAT', line: line, left: exp, right: parseBitwiseAndExpression() };
        }
        return exp;
    }
    
    // a & b
    function parseBitwiseAndExpression() {
        var exp = parseEqualityExpression();
        while (at('AMP')) {
            var line = lexer.line();
            next();
            exp = { type: A.BIN_OP, op: 'AMP', line: line, left: exp, right: parseEqualityExpression() };
        }
        return exp;
    }
    
    // a == b, a != b
    function parseEqualityExpression() {
        var exp = parseCmpExpression();
        while (at('EQ') || at('NEQ')) {
            var line = lexer.line(), op = curr;
            next();
            exp = { type: A.BIN_OP, op: op, line: line, left: exp, right: parseCmpExpression() };
        }
        return exp;
    }
    
    // a < b, a > b, a <= b, a >= b
    function parseCmpExpression() {
        var exp = parseShiftExpression();
        while (at('LT') || at('GT') || at('LE') || at('GE')) {
            var line = lexer.line(), op = curr;
            next();
            exp = { type: A.BIN_OP, op: op, line: line, left: exp, right: parseShiftExpression() };
        }
        return exp;
    }
    
    // a << b, a >> b
    function parseShiftExpression() {
        var exp = parseAddSubExpression();
        while (at('L_SHIFT') || at('R_SHIFT')) {
            var line = lexer.line(), op = curr;
            next();
            exp = { type: A.BIN_OP, op: op, line: line, left: exp, right: parseAddSubExpression() };
        }
        return exp;
    }
    
    // a + b, a - b
    function parseAddSubExpression() {
        var exp = parseMulDivPowModExpression();
        while (at('ADD') || at('SUB')) {
            var line = lexer.line(), op = curr;
            next();
            exp = { type: A.BIN_OP, op: op, line: line, left: exp, right: parseMulDivPowModExpression() };
        }
        return exp;
    }
    
    // a * b, a / b, a ** b, a % b
    function parseMulDivPowModExpression() {
        var exp = parseUnary();
        while (at('MUL') || at('DIV') || at('POW') || at('MOD')) {
            var line = lexer.line(), op = curr;
            next();
            exp = { type: A.BIN_OP, op: op, line: line, left: exp, right: parseUnary() };
        }
        return exp;
    }
    
    // !foo, ~foo, -foo, +foo
    function parseUnary() {
        if (at('BANG') || at('TILDE') || at('SUB') || at('ADD')) {
            var line = lexer.line();
            var root = { type: A.UN_OP, op: curr, line: line, exp: null }, curr = root;
            next();
            while (at('BANG') || at('TILDE') || at('SUB') || at('ADD')) {
                line = lexer.line();
                curr.exp = { type: A.UN_OP, op: curr, line: line, exp: null };
                curr = curr.exp;
                next();
            }
            curr.exp = parseAtom();
            return root;
        } else {
            return parseAtom();
        }
    }

    function parseAtom() {
        var exp = null, line = lexer.line();

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
        } else if (at('COLOR')) {
            exp = decodeColor(text());
            next();
        } else if (at('L_PAREN')) {
            next();
            exp = parseExpression();
            accept('R_PAREN');
        } else {
            error("expected: expression");
        }

        return exp;
    }

    return {
        parseModule         : parseModule
    };

}