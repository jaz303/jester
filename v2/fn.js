function Fn() {

    this.name = null;

    this.enclosingFn = null;
    this.innerFns = [];

    this.names = [];


}

Fn.prototype.addLocalReference = function(name) {
    console.log("local: " + name);
}

Fn.prototype.addVariableReference = function(name) {
    console.log("var: " + name);
}

Fn.prototype.close = function() {
    // iterate over all symbols
}

Fn.prototype._addName = function(name) {

}

module.exports = Fn;