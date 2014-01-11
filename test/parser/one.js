var $ = require('../_prelude');

var rfs = require('fs').readFileSync;

var input   = process.argv[2]
    output  = process.argv[3],
    source  = rfs(input, {encoding: 'utf8'}),
    expect  = rfs(output, {encoding: 'utf8'}),
    lexer   = $.jester.lexer(source),
    parser  = $.jester.parser(lexer);

function sanitise(code) {
    return code.replace(/\t/g, '    ').trim();
}

try {
    
    var pretty = $.jester.prettyPrint(parser.parseTopLevel());

    if (sanitise(pretty) !== sanitise(expect)) {

        console.log("Expected");
        console.log("--------");
        console.log(expect);
        
        console.log("\nActual");
        console.log("------");
        console.log(pretty);

        throw new Error("fail: " + input);
    }

} catch (e) {
    if (e instanceof $.jester.ParseError) {
        console.log(input + ": parse error, expected token: " + e.expectedToken);    
    } else {
        console.log(e.message);
    }
    
    process.exit(1);
}
