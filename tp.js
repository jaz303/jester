var parser = require('./grammar');
var util = require('util');

var source = require('fs').readFileSync(process.argv[2], {encoding: 'utf8'});

console.log(util.inspect(parser.parse(source), {
	depth: null,
	colors: true
}));