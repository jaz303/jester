module.exports = Module;

var A = require('../ast_nodes');

function Module(path) {
	this.path = path;
	this.type = A.MODULE;
	this.imports = null; // filled in by parser
	this.exports = null; // filled in by parser
	this.body = null; // filled in by parser
	this.precompiled = false;
	this.exportedSymbols = null;
	this.importedSymbols = null;
}

Module.prototype.resolveExports = function(ctx) {
	var syms = {};
	this.exports.forEach(function(ex) {
		if (ex.bang) {
			syms = ex.symbols;
		} else {
			for (var i = 0; i < ex.symbols.length; i += 2) {
				var exportedSymbol = ex.symbols[i],
					alias = ex.symbols[i+1];
				if (alias in syms) {
					throw new Error("duplicate exported symbol alias: " + alias);
				}
				syms[alias] = exportedSymbol;
			}
		}
	}, this);
	this.exportedSymbols = syms;
}

Module.prototype.resolveImports = function(ctx) {

	var syms = {};

	this.imports.forEach(function(i) {

		var im = ctx.getModuleByPath(i.path);

		if (i.bang) {
			if (i.imports) {
				// listed imports become imported symbols, taking
				// any aliases into account
			} else {
				// all exported symbols 
			}
		} else {
			// listed module name becomes imported symbol + alias
		}

	}, this);

	this.importedSymbols = syms;

}