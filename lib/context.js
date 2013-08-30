"use strict";

var createVM 		= require('./vm').createVM,
	createLexer 	= require('./lexer').createLexer,
	createParser 	= require('./parser').createParser,
	createCompiler	= require('./compiler').createCompiler,
	taskStates 		= require('./task_states'),
	types 			= require('./types');

function createContext(vm) {

	vm = vm || createVM();
	
	//
	// Ghetto stdlib
	
	vm.trace = function(vm, task, frame) {
		console.log("tracin'", task, frame);
		console.log(frame.dirtyLocals());
	}
	
	vm.env['random'] = function() {
		return Math.floor(Math.random() * 1000);
	}
	
	vm.env['delay'] = function(args, task, env, vm) {
		
		if (task.state === taskStates.RESUMED) {
			task.state = taskStates.RUNNABLE;
			return null;
		}
		
		task.state = taskStates.BLOCKED;
		setTimeout(function() { vm.resumeTask(task); }, args[0]);
		
	};
	
	vm.env['print'] = function(args) {
		var val = args[0];
		if (typeof val !== 'object') {
			console.log(args[0]);
		} else {
			switch (val.__type__) {
				case types.T_FN:
					console.log("<Function>");
					break;
				case types.T_TASK:
					console.log("<Task id=" + val.id + ">");
					break;
				default:
					console.log("<Unknown>");
			}
		}
	};
	
	function start() {
		vm.start();
	}
	
	function run(source, filename) {
		try {
			var lexer 		= createLexer(source),
				parser    	= createParser(lexer),
				ast       	= parser.parseTopLevel(),
				compiler  	= createCompiler(),
				result    	= compiler.compile(ast);

			vm.merge(result.symbols);
			vm.spawn(result.topLevelFn);
		} catch (e) {
			console.log(e);
		}
	}
	
	return {
		start   : start,
		run     : run
	};
	
}

exports.createContext = createContext;