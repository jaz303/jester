var Module = require('./internals/Module');

function expectNodeType(ast, type) {
	if (ast.type !== type) {
		throw new Error("AST node type mismatch, got " + ast.type, "expected " + type);
	}
}

function Compiler(context) {
	this._context = context;
}

Compiler.prototype.compileModule = function(ast, cb) {

	expectNodeType(ast, A.MODULE);

	var mod = new Module();

	function processImport(import) {
		
	}








	/*

	need a module loader and some example source, preferably with some
	circular imports...

	process for getting module exports:
	- load module source
	- parse source
	- module needs a flag stating whether or not exports have been compiled

	for each import
		look up imported module
		if module is not present
			load module source
			parse module source
			compile module stub
		load module exports into module variables
	end

	for each export
		set exported symbols
	end

	set depth to zero

	compile statements

	*/

	var mod = new Module();

	var ports = ast.ports || [];

	ports.filter(function(p) { p.type === A.IMPORT; }).forEach(function(i) {

	});
	
	(ast.ports || []).forEach(function(port) {
		if (port.type === A.EXPORT) {

			var bang = false, count = 0;

		} else if (port.type === A.IMPORT) {

		}
	});

}
