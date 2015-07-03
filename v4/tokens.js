exports.keywords = {};
exports.symbols = {};

exports.EOF = { name: 'eof' };
exports.ERROR = { name: 'error' };
exports.NL = { name: 'newline' };
exports.IDENT = { name: 'ident' };
exports.GLOBAL_IDENT = { name: 'global-ident' };
exports.HEX = { name: 'hex-literal' };
exports.BINARY = { name: 'binary-literal' };
exports.FLOAT = { name: 'float-literal' };
exports.INTEGER = { name: 'integer-literal' };
exports.STRING = { name: 'string-literal' };

var A = require('./ast');

makeSymbols({
    LE          : { text: '<=', binOp: A.BinOpCmpLE },
    GE          : { text: '>=', binOp: A.BinOpCmpGE },
    LSHIFT      : { text: '<<', binOp: A.BinOpShiftLeft },
    RSHIFT      : { text: '>>', binOp: A.BinOpShiftRight },
    EQ          : { text: '==', binOp: A.BinOpCmpEQ },
    NEQ         : { text: '!=', binOp: A.BinOpCmpNEQ },
    POW         : { text: '**', binOp: A.BinOpPow },
    OR          : '||',
    AND         : '&&',
    DOTBRACE    : '.{',

    QUESTION    : '?',
    DOT         : '.',
    SEMICOLON   : ';',
    COMMA       : ',',
    PIPE        : { text: '|', binOp: A.BinOpBitwiseOr },
    AMP         : { text: '&', binOp: A.BinOpBitwiseAnd },
    EQUALS      : '=',
    MINUS       : { text: '-', binOp: A.BinOpSub },
    PLUS        : { text: '+', binOp: A.BinOpAdd },
    STAR        : { text: '*', binOp: A.BinOpMul },
    SLASH       : { text: '/', binOp: A.BinOpDiv },
    BACKSLASH   : { text: '\\', binOp: A.BinOpIntDiv },
    PERCENT     : { text: '%', binOp: A.BinOpMod },
    BANG        : '!',
    LT          : { text: '<', binOp: A.BinOpCmpLT },
    GT          : { text: '>', binOp: A.BinOpCmpGT },
    TILDE       : '~',
    HAT         : { text: '^', binOp: A.BinOpBitwiseXor },
    LBRACE      : '{',
    RBRACE      : '}',
    LBRACKET    : '[',
    RBRACKET    : ']',
    LPAREN      : '(',
    RPAREN      : ')'
});

makeKeywords({
    DEF         : 'def',
    ELSE        : 'else',
    FALSE       : 'false',
    FOREACH     : 'foreach',
    IF          : 'if',
    LOOP        : 'loop',
    RETURN      : 'return',
    SPAWN       : 'spawn',
    TRUE        : 'true',
    WHILE       : 'while',
    YIELD       : 'yield',
});

function makeSymbols(toks) {
    for (var k in toks) {
        var tok = toks[k];
        if (typeof tok === 'string') {
            tok = { text: toks[k] };    
        }
        exports[k] = tok;
        exports.symbols[tok.text] = tok;
    }
}

function makeKeywords(kws) {
    for (var k in kws) {
        var tok = { text: kws[k] };
        exports[k] = tok;
        exports.keywords[kws[k]] = tok;
    }
}