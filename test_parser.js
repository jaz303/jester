var source = require('fs').readFileSync('v3-test.jester', 'utf8');

require('./v3/parser').parse(source);

console.log("done!");