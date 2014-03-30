#!/usr/bin/env node

var jester  = require('./v2'),
    fs      = require('fs');

var args = process.argv.slice(1);

fs.readFile(args[1], 'utf8', function(err, source) {

	var parser 	= jester.parser(source),
		ctx 	= new jester.Context(),
		mod 	= parser.parseModule('<<main>>');
		
	var pre = new jester.Precompiler(ctx);

	pre.precompile(mod, function(err, loadOrder) {
		if (err) {
			console.log("error!");
			console.log(err);
			console.log(err.stack);
		} else {
			console.log("done!");
			console.log(loadOrder);	
		}
	});

});