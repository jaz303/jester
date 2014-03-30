var A = require('./ast_nodes');

module.exports = Precompiler;

function Precompiler(context) {
	this._context = context;
}

Precompiler.prototype._loadModuleTree = function(rootModule, loadOrder, cb) {

	rootModule.precompiled = true;

	var self 	= this,
		imports = rootModule.imports,
		remain 	= imports.length,
		failed 	= false;

	if (remain === 0) {
		done();
		return;
	}

	function done() {
		loadOrder.push(rootModule);
		cb(null, loadOrder);
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
		} else if (--remain == 0) {
			done();
		}
	}

	imports.forEach(function(i) {
		if (!i.path) {
			i.path = self._context.resolveModulePath(i.module, rootModule);
		}
		self._context.loadModuleByPath(i.path, function(err, childModule) {
			if (err) {
				fail(err);
				return;
			}
			if (childModule.precompiled) {
				complete();
			} else {
				self._loadModuleTree(childModule, loadOrder, function(err) {
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

Precompiler.prototype.precompile = function(rootModule, cb) {

	this._loadModuleTree(rootModule, [], function(err, loadOrder) {

		if (err) {
			cb(err);
			return;
		}

		try {
			
			loadOrder.forEach(function(mod) {
				mod.resolveExports(this._context);
			}, this);
			
			loadOrder.forEach(function(mod) {
				mod.resolveImports(this._context);
			}, this);

		} catch (e) {
			cb(e);
			return;
		}

		cb(null, loadOrder);

	}.bind(this));

}