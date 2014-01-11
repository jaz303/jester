var T           = require('./tokens').tokens,
    TN          = require('./tokens').names,
    A           = require('./ast_nodes'),
    ParseError  = require('./parse_error');

module.exports = function(lexer) {

    //
    // helpers

    var curr = null;

    function next() {
        curr = lexer.next();
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
        if (curr === T.ERROR) {
            msg = lexer.error();
        }
        throw new ParseError(
            msg,
            lexer.line(),
            lexer.column(),
            expectedToken ? TN[expectedToken] : null,
            TN[curr]
        );
    }

    //
    //

    function parseTopLevel() {

        var program = { type: A.MODULE, body: [] };

        next();
        program.body.push(parseAtom());

        accept(T.EOF);

        return program;

    }

    function parseAtom() {
        var exp = null, line = lexer.line();

        if (at(T.TRUE)) {
            exp = true;
            next();
        } else if (at(T.FALSE)) {
            exp = false;
            next();
        } else if (at(T.INTEGER)) {
            exp = {
                type: A.INTEGER,
                value: parseInt(text(), 10)
            };
            next();
        }

        return exp;
    }

    return {
        parseTopLevel       : parseTopLevel
    };

}