#!/usr/bin/env node

var parser 		= require('./v3/parser'),
	analyse 	= require('./v3/analysis/analyse'),
    fs      	= require('fs');

var args = process.argv.slice(1);

fs.readFile(args[1], 'utf8', function(err, source) {

	var mod = parser.parse(source);

	analyse(mod);

});