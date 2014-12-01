var $ = require('../_prelude');

var source  = require('fs').readFileSync(process.argv[2], {encoding: 'utf8'}),
    chunks  = source.split('---'),
    A       = $.jester.ast,
    expect  = eval('(' + chunks[1] + ')'),
    eq      = require('assert').deepEqual,
    inspect = require('util').inspect;

// remove line numbers from AST, don't care about testing it here
function zap(tree) {
    if (Array.isArray(tree)) {
        tree.forEach(zap);
    } else if (tree && typeof tree === 'object') {
        if ('line' in tree) delete tree.line;
        for (var k in tree) {
            zap(tree[k]);
        }
    }
    return tree;
}

try {
    var result = $.jester.parser.parse(chunks[0], {start: 'Module'});
    if (!('ports' in expect)) expect.ports = []; // to avoid rewriting every test
    eq(zap(result), zap(expect));
} catch (e) {
    if (e.name === 'AssertionError') {
        console.log("** Failure in " + process.argv[2] + " **\n");
        console.log("Expected\n---------");
        console.log(inspect(expect, {colors: true, depth: null}));
        console.log('');
        console.log("Actual\n------");
        console.log(inspect(result, {colors: true, depth: null}));
        console.log('');
    } else {
        console.log(e); 
    }
    process.exit(1);
}
