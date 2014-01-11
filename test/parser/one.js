var $ = require('../_prelude');

var rfs = require('fs').readFileSync;

var input   = process.argv[2]
    output  = process.argv[3],
    source  = rfs(input, {encoding: 'utf8'}),
    ast     = rfs(output, {encoding: 'utf8'}).trim(),
    lexer   = $.jester.lexer(source),
    parser  = $.jester.parser(lexer);

try {
    
    var pretty = $.jester.prettyPrint(parser.parseTopLevel()).trim();

    console.log(pretty);

} catch (e) {
    console.log(input + ": parse error, expected token: " + e.expectedToken);
    process.exit(1);
}
