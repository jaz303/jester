var S_OUT               = 1,
    S_WHITESPACE        = 2,
    S_STRING            = 3;

var NBSP                = String.fromCharCode(160);

/*
 * There are two situations where the Jester grammar is whitespace-
 * sensitive: (1) in the case of function composition, e.g. "f . g",
 * and (2) a no-paren call whose first argument is a literal array,
 * e.g. "foo [1,2,3]". The parser ignores whitespace so these forms
 * will degrade to property lookup ("f.g") and indexing ("foo[1,2,3]").
 *
 * Rather than complicate the grammar with significant whitespace it's
 * easier to pre-scan the input text for these forms and inject a
 * sentinel character whenever one is encountered.
 */
module.exports = exports = function(source) {

    var out     = [];
    var state   = S_OUT;
    var skip    = false;
    var str     = null;

    for (var i = 0, len = source.length; i < len; ++i) {
        var ch = source[i];
        switch (state) {
            case S_OUT:
                if (ch === ' ' || ch === '\t') {
                    state = S_WHITESPACE;
                } else if (ch === '"' || ch === "'") {
                    state = S_STRING;
                    str = ch;
                }
                break;
            case S_WHITESPACE:
                if (ch === ' ' || ch === '\t') {
                    // do nothing
                } else if (ch === '"' || ch === "'") {
                    state = S_STRING;
                    str = ch;
                } else if (ch === '[' || ch === '.') {
                    out.push(NBSP);
                    state = S_OUT;
                } else {
                    state = S_OUT;
                }
                break;
            case S_STRING:
                if (skip) {
                    skip = false;
                } else if (ch === '\\') {
                    skip = true;
                } else if (ch === str) {
                    state = S_OUT;
                }
                break;
        }
        out.push(ch);
    }

    return out.join('');

}

exports.NBSP = NBSP;