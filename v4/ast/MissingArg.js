module.exports = MissingArg;

var Base = require('./Base');

MissingArg.prototype.type = require('./type')('MISSING_ARG');

function MissingArg() {}