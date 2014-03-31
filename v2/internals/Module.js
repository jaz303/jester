module.exports = Module;

var A = require('../ast_nodes');

function Module(path) {
	this.path = path;
	this.type = A.MODULE;
	this.imports = null; // filled in by parser
	this.exports = null; // filled in by parser
	this.body = null; // filled in by parser
	this.precompiled = false;
	this.compiled = false;
	this.exportedSymbols = null;
	this.importedSymbols = null;
}

Module.prototype.isBangExported = function() {
	return typeof this.exportedSymbols === 'string';
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

	function addImportedSymbol(localSymbol, sourceModule, sourceSymbol) {
		if (localSymbol in syms) {
			throw new Error("duplicate imported symbol: " + localSymbol);
		} else {
			syms[localSymbol] = true;
		}
	}

	function addImportByModuleName(moduleName, alias, sourceModule) {

		// if there's an alias we just use that as the symbol
		if (alias) {
			syms[alias] = true;
		}

		// if module name is an ident, use identifier name as symbol
		else if (moduleName.type === A.IDENT) {
			syms[moduleName.name] = true;
		}

		// otherwise it's an error; if you're using a string as a
		// module name you *must* alias it.
		// FIXME: should this be caught by the parser?
		else {
			throw new Error("imported modules identified by strings MUST be aliased");
		}

	}

	this.imports.forEach(function(imp) {

		var mod = ctx.getModuleByPath(imp.path);

		// bang import; imported module's exports are placed directly
		// in the importing module's symbol table
		if (imp.bang) {

			// we're importing an explicit list of symbols...
			if (imp.symbols) {

				// can't import an explicit list from bang-exported module
				if (mod.isBangExported()) {
					throw new Error("cannot selectively import from a bang-exported module");
				}

				for (var i = 0; i < imp.symbols.length; i += 2) {
					
					var importedSymbol 	= imp.symbols[i],
						alias 			= imp.symbols[i+1];

					// if imported module does not export such a symbol, error
					if (!(importedSymbol in mod.exportedSymbols)) {
						// TODO: need to fix this error message
						throw new Error("unknown symbol for import");
					}

					// otherwise, note the import
					else {
						addImportedSymbol(alias, mod, importedSymbol);
					}

				}
			}

			// importing all symbols
			else {

				// if imported symbol is bang exported, its bang-export is imported
				// into the imported module's scope
				if (mod.isBangExported()) {
					addImportByModuleName(imp.module, imp.alias, mod);
				}

				// otherwise just take each of the imported module's symbols
				// and place them in our symbol table
				else {
					for (var exportedSymbol in mod.exportedSymbols) {
						addImportedSymbol(exportedSymbol, mod, exportedSymbol);
					}
				}

			}

		// not a bang import
		// "import foo" will either:
		// 1) if 'foo' is a bang export, copies its exported thing into module scope
		// 2) otherwise creates a local dictionary containing foo's exports
		} else {

			addImportByModuleName(imp.module, imp.alias, mod);

		}

	}, this);

	this.importedSymbols = syms;

}