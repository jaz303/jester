var test = require('tape');
var prelexer = require('../v3/prelexer.js');

var NBSP = prelexer.NBSP;

test("sanity - NBSP is not normal space or tab", function(assert) {

	assert.ok(NBSP !== ' ');
	assert.ok(NBSP !== '\t');
	assert.end();

});

test("double-quoted string is not modified", function(assert) {

	var SRC = '"foo . bar ["';

	var res = prelexer(SRC);

	assert.equal(res, SRC);
	assert.end();

});

test("single-quoted string is not modified", function(assert) {

	var SRC = "' [1, 2, 3] foo . bar'";

	var res = prelexer(SRC);

	assert.equal(res, SRC);
	assert.end();

});

test("compose operator is identified", function(assert) {

	var SRC = "  foo . bar  ";

	var expect = "  foo " + NBSP + ". bar  ";
	var res = prelexer(SRC);

	assert.equal(res, expect);
	assert.end();

});

test("standalone array is identified", function(assert) {

	var SRC = "foo [1,2,3]";

	var expect = "foo " + NBSP + "[1,2,3]";
	var res = prelexer(SRC);

	assert.equal(res, expect);
	assert.end();

});

test("multiple", function(assert) {

	var PRE = "foo $. bar 'this is . [ string' here $[ \"another string [ foo .\"";
	var SRC = PRE.replace(/\$/g, '');
	
	var expect = PRE.replace(/\$/g, NBSP);
	var res = prelexer(SRC);

	assert.equal(res, expect);
	assert.end();

});