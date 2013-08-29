#!/usr/bin/env node

var jester  = require('./'),
    fs      = require('fs');

var args = process.argv.slice(1);

fs.readFile(args[1], 'utf8', function(err, source) {

    var context = jester.createContext();

    context.start();
    context.run(source, args[0]);

});