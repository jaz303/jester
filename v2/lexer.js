"use strict";

var SYMBOLS     = require('./tokens').symbolsToTokens,
    KEYWORDS    = require('./tokens').keywords;

function space_p(ch) {
    return ch === ' ' || ch === '\t';
}

module.exports = function() {

    var TOKENS = [
        // symbols
        {   pattern: /^(<=|>=|<<|>>|==|\?|\!=|\*\*|\|\||&&|\.\{|[\.,;=\-\+\*\/%\!<>~^\|\&\{\}\[\]\(\)])/,
            cb: function(match) {
                return SYMBOLS[match[0]];
            }
        },
        // foo, bar, return
        {   pattern: /^[a-zA-Z_][a-zA-Z0-9_]*[\!\?]?/,
            cb: function(match) {
                return KEYWORDS[text] || 'IDENT';
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
                return (match[0].length === 1) ? 'DOLLAR' : 'GLOBAL_IDENT';
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

    var src,        /* source we're scanning */
        p,          /* current position in src */
        len,        /* length of src */
        tok,        /* result of last call to nextToken() */
        text,       /* parsed text of last token */
        error,      /* error */
        curLine,
        curCol,
        tokLine,
        tokCol;

    function more() { return p < len - 1; }
    function two_more() { return p < len - 2; }
    function adv(n) { n = n || 1; p += n; curCol += n; }
    
    function setInput(input) {
        src         = input;
        p           = 0;
        len         = input.length;
        tok         = null;
        text        = null;
        error       = null;
        curLine     = 1;
        curCol      = 1;
        tokLine     = null;
        tokCol      = null;
    }

    function nextToken() {
        
        text = null;
        
        if (p === len)
            return 'EOF';
        
        // skip whitespace
        if (space_p(src[p])) {
            while (space_p(src[p])) {
                adv();
                if (p === len)
                    return 'EOF';
            }
            // compose operator requires surrounding space e.g. ' . '
            // it's the only time space is significant so it's easiest just to
            // special-case it here.
            if (src[p] === '.' && more() && src[p+1] === ' ') {
                adv(2);
                return 'COMPOSE';
            }
        }
        
        // skip comments
        if (src[p] === '-' && more() && src[p+1] === '-') {
            adv(2);
            while (true) {
                if (p === len)
                    return 'EOF';
                if (src[p] === '\r' || src[p] === '\n')
                    break;
                adv();
            }
        }
        
        // if we get to this point we known we're at a token
        // stash its position in the source.
        tokLine = curLine;
        tokCol = curCol;
        
        // newline
        if (src[p] === '\n') {
            p++;
            curLine++;
            curCol = 1;
            return 'NL';
        } else if (src[p] === '\r') {
            if (more() && src[p+1] === '\n') {
                p++;
            }
            p++;
            curLine++;
            curCol = 1;
            return 'NL';
        }

        var remainder = src.substring(p);

        for (var i = 0; i < N_TOKENS; ++i) {
            var matchResult = TOKENS[i].pattern.exec(remainder);
            if (matchResult) {
                adv(matchResult[0].length);
                text = matchResult[0];
                return TOKENS[i].cb(matchResult);
            }
        }

        error = "unexpected character in input: '" + ch + "'";
        return 'ERROR';

    }
    
    return {
        lex           : nextToken,                      /* advance to next token and return */
        setInput      : setInput,
        text          : function() { return text; },    /* text of current token */
        error         : function() { return error; },   /* error message */
        line          : function() { return tokLine; }, /* start line of current token */
        column        : function() { return tokCol; }   /* start column of current token */
    };
    
};
