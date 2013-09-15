function sexp() {

}

module.exports = sexp;

var parser = sexp();

console.log(parser("(1 2 3 (foo bar baz))"));