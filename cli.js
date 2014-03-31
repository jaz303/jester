#!/usr/bin/env node

var jester  	= require('./v2'),
    fs      	= require('fs');

var args = process.argv.slice(1);

fs.readFile(args[1], 'utf8', function(err, source) {

	var parser 		= jester.parser(source),
		ctx 		= new jester.Context(),
		mod 		= parser.parseModule('<<main>>');
		compiler 	= new jester.Compiler(ctx);

	compiler.compileModule(mod, function(err, loadOrder) {
		if (err) {
			console.log("compile error!");
			conolse.log(err);
			console.log(err.stack);
		} else {
			console.log("compilation complete!");
			// ...
		}
	});

});