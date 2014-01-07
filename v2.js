var tok = require('./v2/tokens.js');

module.exports = {
    tokens      : tok.tokens,
    tokenNames  : tok.names,
    lexer       : require('./v2/lexer.js')
};
