exports.jester = require('../v2');

var tape = exports.tape = require('tape');

exports.st = function(name, cb) {
    tape(name, function(test) {
        cb(test);
        test.end();
    })
}
