exports.keywords = {};
exports.symbols = {};

exports.EOF = { name: 'eof' };
exports.ERROR = { name: 'error' };
exports.NL = { name: 'newline' };
exports.IDENT = { name: 'ident' };
exports.HEX = { name: 'hex-literal' };
exports.BINARY = { name: 'binary-literal' };
exports.FLOAT = { name: 'float-literal' };
exports.INTEGER = { name: 'integer-literal' };
exports.STRING = { name: 'string-literal' };

makeSymbols({
    LE          : '<=',
    GE          : '>=',
    LSHIFT      : '<<',
    RSHIFT      : '>>',
    EQ          : '==',
    NEQ         : '!=',
    POW         : '**',
    OR          : '||',
    AND         : '&&',
    DOTBRACE    : '.{',

    COMMA       : ',',
    PIPE        : '|',
    AMP         : '&',
    EQUALS      : '=',
    MINUS       : '-',
    PLUS        : '+',
    STAR        : '*',
    SLASH       : '/',
    BACKSLASH   : '\\',
    PERCENT     : '%',
    BANG        : '!',
    LT          : '<',
    GT          : '>',
    TILDE       : '~',
    HAT         : '^',
    LBRACE      : '{',
    RBRACE      : '}',
    LBRACKET    : '[',
    RBRACKET    : ']',
    LPAREN      : '(',
    RPAREN      : ')'
});

makeKeywords({
    WHILE       : 'while',
    LOOP        : 'loop',
    IF          : 'if',
    ELSE        : 'else',
    RETURN      : 'return',
    SPAWN       : 'spawn',
    YIELD       : 'yield'
});

function makeSymbols(toks) {
    for (var k in toks) {
        var tok = { text: toks[k] };
        exports[k] = tok;
        exports.symbols[toks[k]] = tok;
    }
}

function makeKeywords(kws) {
    for (var k in kws) {
        var tok = { text: kws[k] };
        exports[k] = tok;
        exports.keywords[kws[k]] = tok;
    }
}