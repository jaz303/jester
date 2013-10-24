var A = require('../lib/ast_nodes');
var Fn = require('./fn');

// first compiler pass
// 1. creates stub function prototypes for all defined functions
// 2. walks module AST and identifies free/local variables
function pass1(ast) {

    if (ast.type !== A.MODULE) {
        throw new Error("pass1 expects module");
    }

    function walkFn(ast, fn) {

        function walkCall(exp) {
            walkExpr(exp.fn);
            exp.args.forEach(function(arg) { walkExpr(arg); });
        }

        function walkExpr(exp) {

            if (typeof exp !== 'object') {
                return;
            }

            switch (exp.type) {
                case A.COLOR:
                case A.TRACE:
                case A.GLOBAL_IDENT:
                    // do nothing
                    break;
                case A.ASSIGN:
                    fn.addLocalReference(exp.left.name);
                    walkExpr(exp.right);
                    break;
                case A.IDENT:
                    fn.addVariableReference(exp.name);
                    break;
                case A.CALL:
                    walkCall(exp);
                    break;
                case A.BIN_OP:
                    walkExpr(exp.left);
                    walkExpr(exp.right);
                    break;
                case A.UN_OP:
                    walkExpr(exp.exp);
                    break;
                case A.SPAWN:
                    walkCall(exp);
                    break;
                case A.EVAL:
                    walkExpr(node.code);
                    break;
            }

        }

        function walkBody(list) {
            list.forEach(function(node) {

                if (typeof node !== 'object') {
                    return;
                }

                switch (node.type) {
                    case A.DEF:
                        innerFunctionNodes.push(node);
                        fn.addLocalReference(node.name);
                        break;
                    case A.IF:
                        node.clauses.forEach(function(c) {
                            c.condition && walkExpr(c.condition);
                            walkBody(c.body);
                        });
                        break;
                    case A.WHILE:
                        walkExpr(node.condition);
                        walkBody(node.body);
                        break;
                    case A.LOOP:
                        walkBody(node.body);
                        break;
                    case A.RETURN:
                        walkExpr(node.returnValue);
                        break;
                    case A.YIELD:
                        /* do nothing */
                        break;
                    default:
                        walkExpr(node);
                        break;
                }

            });
        }

        function walkInnerFunctions() {
            innerFunctionNodes.forEach(function(node) {

                var innerFn = node.fn = new Fn();
                innerFn.name = node.name;
                innerFn.enclosingFn = fn;

                fn.innerFns.push(innerFn);

                node.parameters.forEach(function(p) {
                    innerFn.addLocalReference(p);
                });

                walkFn(node, innerFn);
                
            });
        }

        var innerFunctionNodes = [];

        walkBody(ast.body);
        walkInnerFunctions();

        fn.close();

    }

    var fn = new Fn();
    fn.name = '--top--';
    fn.enclosingFn = null;

    ast.fn = fn;

    walkFn(ast, fn);

}

module.exports = pass1;