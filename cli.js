#!/usr/bin/env node

var jester  = require('./v2'),
    fs      = require('fs');

var args = process.argv.slice(1);

fs.readFile(args[1], 'utf8', function(err, source) {

	var parser 	= jester.parser(source),
		mod 	= new jester.Module(null, parser.parseModule()),
		ctx 	= new jester.Context();

	var pre = new jester.Precompiler(ctx);

	pre.precompile(mod, function(err, modMap) {
		if (err) {
			console.log("error!");
			console.log(err);
			console.log(err.stack);
		} else {
			console.log(modMap);	
		}
	});

});