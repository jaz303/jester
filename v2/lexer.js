"use strict";

var KEYWORDS = require('./tokens').keywords;

module.exports = function() {

    var TOKENS = [
        // symbols
        {   pattern: /^(<=|>=|<<|>>|==|\?|\!=|\*\*|\|\||&&|\||&|\.\{|[\.,;=\-\+\*\/%\!<>~^\|\&\{\}\[\]\(\)])/,
            cb: function(match) {
                return match[0];
            }
        },
        // foo, bar, return
        {   pattern: /^[a-zA-Z_][a-zA-Z0-9_]*[\!\?]?/,
            cb: function(match) {
                return KEYWORDS[match[0]] || 'IDENT';
            }
        },
        // 0xb1010, 0xffff
        {   pattern: /^0(b[01]+|x[0-9A-Fa-f]+)/,
            cb: function(match) {
                return (match[0].charAt(1) === 'x') ? 'HEX' : 'BINARY';
            }
        },
        // numbers
        {
            pattern: /^[0-9][0-9_]*(\.[0-9][0-9_]*)?/,
            cb: function(match) {
                return match[1] ? 'FLOAT' : 'INTEGER';
            }
        },
        // $, $foo
        {   pattern: /^\$([a-zA-Z_][a-zA-Z0-9_]*)?/,
            cb: function(match) {
                return (match[0].length === 1) ? '$' : 'GLOBAL_IDENT';
            }
        },
        // #, #red, #ff0000
        {   pattern: /^#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[a-zA-Z_]+)?/,
            cb: function(match) {
                return (match[0].length === 1) ? 'POUND' : 'COLOR';
            }
        },
        // strings
        // TODO: fix curLine/curCol
        {   pattern: /^"(\\[\\trn"]|[^\\"])*"/,
            cb: function(match) {
                return 'STRING';
            }
        }
    ];

    var N_TOKENS  = TOKENS.length;

    var src, len;

    function start(input) {

        src = input;
        len = input.length;

        return {
            p           : 0,        // current position in text
            text        : null,     // text of last token
            error       : null,     // last error
            line        : null,     // start line of last token
            column      : null,     // start column of last token
            scanLine    : 1,        // current line
            scanColumn  : 1,        // current column
        };
    
    }

    function clone(state) {
        return {
            p           : state.p,
            text        : state.text,
            error       : state.error,
            line        : state.line,
            column      : state.column,
            scanLine    : state.scanLine,
            scanColumn  : state.scanColumn
        };
    }

    function more(s) { return s.p < len - 1; }
    function two_more(s) { return s.p < len - 2; }
    function adv(s, n) { s.p += n; s.scanColumn += n; }

    function nextToken(s) {

        if (s.p === len)
            return 'EOF';
        
        // skip whitespace
        if (src[s.p] === ' ' || src[s.p] === '\t') {
            while (src[s.p] === ' ' || src[s.p] === '\t') {
                adv(s, 1);
                if (s.p === len)
                    return 'EOF';
            }
            // compose operator requires surrounding space e.g. ' . '
            // it's the only time space is significant so it's easiest just to
            // special-case it here.
            if (src[s.p] === '.' && more(s) && src[s.p+1] === ' ') {
                adv(s, 2);
                return 'COMPOSE';
            }
        }
        
        // skip comments
        if (src[s.p] === '-' && more(s) && src[s.p+1] === '-') {
            adv(s, 2);
            while (true) {
                if (s.p === len)
                    return 'EOF';
                if (src[s.p] === '\r' || src[s.p] === '\n')
                    break;
                adv(s, 1);
            }
        }
        
        // if we get to this point we known we're at a token
        // stash its position in the source.
        s.line      = s.scanLine;
        s.column    = s.scanColumn;
        
        // newline
        if (src[s.p] === '\n') {
            s.p++;
            s.scanLine++;
            s.scanColumn = 1;
            return 'NL';
        } else if (src[s.p] === '\r') {
            if (more(s) && src[s.p+1] === '\n') {
                s.p++;
            }
            s.p++;
            s.scanLine++;
            s.scanColumn = 1;
            return 'NL';
        }

        var remainder = src.substring(s.p);

        for (var i = 0; i < N_TOKENS; ++i) {
            var matchResult = TOKENS[i].pattern.exec(remainder);
            if (matchResult) {
                adv(s, matchResult[0].length);
                s.text = matchResult[0];
                return TOKENS[i].cb(matchResult);
            }
        }

        s.error = "unexpected character in input: '" + ch + "'";
        return 'ERROR';

    }
    
    return {
        start   : start,
        clone   : clone,
        lex     : nextToken     /* advance to next token and return */
    };
    
};
