var T           = require('./tokens').tokens,
    TN          = require('./tokens').names,
    A           = require('./ast_nodes'),
    COLORS      = require('./colors'),
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
        } else if (at(T.HEX)) {
            exp = {
                type: A.INTEGER,
                value: parseInt(text().substring(2), 16)
            };
            next();
        } else if (at(T.BINARY)) {
            exp = {
                type: A.INTEGER,
                value: parseInt(text().substring(2), 2)
            };
            next();
        } else if (at(T.FLOAT)) {
            exp = {
                type: A.FLOAT,
                value: parseFloat(text(), 10)
            };
            next();
        } else if (at(T.STRING)) {
            exp = {
                type: A.STRING,
                value: decodeString(text())
            };
            next();
        } else if (at(T.TRACE)) {
            exp = { type: A.TRACE };
            next();
        } else if (at(T.IDENT)) {
            exp = {
                type: A.IDENT,
                name: text()
            };
            next();
        } else if (at(T.GLOBAL_IDENT)) {
            exp = {
                type: A.GLOBAL_IDENT,
                name: text().substring(1)
            };
            next();
        } else if (at(T.COLOR)) {
            exp = decodeColor(text());
            next();
        }

        return exp;
    }

    return {
        parseTopLevel       : parseTopLevel
    };

}