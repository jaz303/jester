module.exports = Context;

var A 		= require('../ast_nodes'),
	Module 	= require('./Module'),
	fs 		= require('fs'),
	parser 	= require('../parser');

function Context() {
	this._loadedModules = {};
}

Context.prototype.resolveModulePath = function(moduleName, relativeTo) {
	if (moduleName.type === A.IDENT) {
		// TODO: this should be customisable
		return __dirname + "/../../stdlib/" + moduleName.name + ".jester";	
	} else {
		throw new Error("unsupported module name!");
	}
}

Context.prototype.loadModuleByPath = function(modulePath, cb) {

	var loadedModules = this._loadedModules;

	if (loadedModules[modulePath]) {
		process.nextTick(function() {
			cb(null, loadedModules[modulePath]);
		});
	} else {
		this._loadModuleSource(modulePath, function(err, source) {
			if (err) {
				cb(err);
			} else {
				try {
					var mod = loadedModules[modulePath] = parser(source).parseModule(modulePath);
					cb(null, mod);
				} catch (e) {
					cb(e);
				}
			}
		});
	}

}

Context.prototype.getModuleByPath = function(modulePath) {
	return this._loadedModules[modulePath] || null;
}

Context.prototype._loadModuleSource = function(modulePath, cb) {
	fs.readFile(modulePath, 'utf8', cb);
}