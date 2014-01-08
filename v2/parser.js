module.exports = function(lexer) {

    function parseTopLevel() {

        var program = { type: A.PROGRAM, body: [] };

        program.body.push(parseAtom());

        accept(T.EOF);

        return program;

    }

}