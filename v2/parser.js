var A = require('./ast_nodes');

module.exports = function(lexer) {

    function parseTopLevel() {

        var program = { type: A.MODULE, body: [] };

        program.body.push(parseAtom());

        accept(T.EOF);

        return program;

    }

    function parseAtom() {
        
    }

}