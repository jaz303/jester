var A = require('./ast_nodes');

module.exports = function(ast) {

    var buffer      = '',
        currIndent  = 0;

    function write(str) {
        for (var i = 0; i < currIndent; ++i) {
            buffer += '    ';
        }
        buffer += str;
    }

    function indent() { currIndent += 1; }
    function outdent() { currIndent -= 1; }

    function emit(node) {

        if (Array.isArray(node)) {
            node.forEach(emit);
            return;
        }

        switch (node.type) {
            case A.MODULE:
                write("(program\n");
                indent();
                emit(node.body);
                buffer += ')';
                break;
            default:
                if (node === true) {
                    write("true");
                } else if (node === false) {
                    write("false");
                } else if (typeof node === 'number') {
                    write(node);
                }
        }

    }

    emit(ast);

    return buffer;

}