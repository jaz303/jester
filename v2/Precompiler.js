var A = require('./ast_nodes');

module.exports = Precompiler;

function Precompiler(context) {
	this._context = context;
}

Precompiler.prototype._loadModuleTree = function(rootModule, cb) {

	rootModule.precompiled = true;

	var self 		= this,
		imports 	= (rootModule.ast.ports || []).filter(function(p) { return p.type === A.IMPORT; }),
		remain 		= imports.length,
		failed 		= false;

	if (remain === 0) {
		cb(null);
		return;
	}

	function fail(err) {
		if (failed) {
			return;
		} else if (err) {
			failed = true;
			cb(err);
		}
	}

	function complete(err) {

		if (err) {
			fail(err);
			return;
		}

		if (--remain == 0) {
			cb(null);
		}

	}

	imports.forEach(function(i) {
		if (!i.path) {
			i.path = self._context.resolveModule(i.module, rootModule);
		}
		self._context.loadModule(i.path, function(err, childModule) {
			if (err) {
				fail(err);
				return;
			}
			rootModule.importedModules.push(childModule);
			if (childModule.precompiled) {
				complete();
			} else {
				self._loadModuleTree(childModule, function(err) {
					if (err) {
						fail(err);
						return;
					}
					complete();
				});
			}
		});
	});

}

Precompiler.prototype._resolveExports = function(modMap) {

}

Precompiler.prototype._resolveImports = function(modMap) {

}

Precompiler.prototype.precompile = function(rootModule, cb) {

	this._loadModuleTree(rootModule, function(err) {

		if (err) {
			cb(err);
			return;
		}

		try {
			// this._resolveExports(modMap);
			// this._resolveImports(modMap);
		} catch (e) {
			cb(e);
		}

		cb(null);

	}.bind(this));

}