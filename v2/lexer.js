"use strict";

var T           = require('./tokens').tokens,
    SYMBOLS     = require('./tokens').symbolsToTokens,
    KEYWORDS    = require('./tokens').keywords;

function space_p(ch) {
    return ch === ' ' || ch === '\t';
}

module.exports = function(src) {

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
                return KEYWORDS[text] || T.IDENT;
            }
        },
        // 0xb1010, 0xffff
        {   pattern: /^0(b[01]+|x[0-9A-F-a-f]+)/,
            cb: function(match) {
                return (match[0].charAt(1) === 'x') ? T.HEX : T.BINARY;
            }
        },
        // numbers
        {
            pattern: /^[0-9]+(\.[0-9]+)?/,
            cb: function(match) {
                return match[1] ? T.FLOAT : T.INTEGER
            }
        },
        // $, $foo
        {   pattern: /^\$([a-zA-Z_][a-zA-Z0-9_]*)?/,
            cb: function(match) {
                return (match[0].length === 1) ? T.DOLLAR : T.GLOBAL_IDENT;
            }
        },
        // #, #red, #ff0000
        {   pattern: /^#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[a-zA-Z_]+)?/,
            cb: function(match) {
                return (match[0].length === 1) ? T.POUND : T.COLOR;
            }
        },
        // strings
        // TODO: fix curLine/curCol
        {   pattern: /^"(\\[\\trn"]|[^\\"])*"/,
            cb: function(match) {
                return T.STRING;
            }
        }
    ];

    var N_TOKENS = TOKENS.length;

    var p         = 0,            /* current position in src */
        len       = src.length,   /* length of src */
        tok       = null,         /* result of last call to nextToken() */
        text      = null,         /* parsed text of last token */
        start     = null,         /* temporary marker for start of token being lexed */
        error     = null,         /* error */
        curLine   = 1,
        curCol    = 1,
        tokLine   = null,
        tokCol    = null;
    
    function more() { return p < len - 1; }
    function two_more() { return p < len - 2; }
    function adv(n) { n = n || 1; p += n; curCol += n; }
    
    function nextToken() {
        
        text = null;
        
        if (p === len)
            return T.EOF;
        
        // skip whitespace
        while (space_p(src[p])) {
            adv();
            if (p === len)
                return T.EOF;
        }
        
        // skip comments
        if (src[p] === '-' && more() && src[p+1] === '-') {
            adv(2);
            while (true) {
                if (p === len)
                    return T.EOF;
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
            return T.NEWLINE;
        } else if (src[p] === '\r') {
            if (more() && src[p+1] === '\n') {
                p++;
            }
            p++;
            curLine++;
            curCol = 1;
            return T.NEWLINE;
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
        return T.ERROR;

    }
    
    return {
        next          : nextToken,                      /* advance to next token and return */
        text          : function() { return text; },    /* text of current token */
        error         : function() { return error; },   /* error message */
        line          : function() { return tokLine; }, /* start line of current token */
        column        : function() { return tokCol; }   /* start column of current token */
    };
    
};
