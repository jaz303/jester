#!/usr/bin/env node

var lexer = require('../lib/lexer');
var parser = require('../lib/parser');
var pass1 = require('./pass1');

var fs = require('fs');

var util = require('util');

var filename = process.argv[2];

fs.readFile(filename, 'utf8', function(err, source) {

    var lx      = lexer.createLexer(source),
        pr      = parser.createParser(lx),
        ast     = pr.parseTopLevel(pr);

    pass1(ast);

    console.log(util.inspect(ast, {colors: true, depth: null}));

});
