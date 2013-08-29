var jester  = require('./'),
    fs      = require('fs');

var args = process.argv.slice(2);

fs.readFile(args[0], 'utf8', function(err, source) {

    var context = jester.createContext();

    context.start();
    context.run(source, args[0]);

});