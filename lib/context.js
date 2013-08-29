var createVM 	= require('./vm').createVM,
	parser 		= require('./parser'),
	lexer 		= require('./lexer'),
	compiler 	= require('./compiler'),
	taskStates 	= require('./vm');

function createContext(theVM) {

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
		
		if (task.state == taskStates.TASK_RESUMED) {
			task.state = taskStates.TASK_RUNNABLE;
			return null;
		}
		
		task.state = taskStates.TASK_BLOCKED;
		setTimeout(function() { vm.resumeTask(task); }, args[0]);
		
	};
	
	vm.env['print'] = function(args) {
		console.log("VM say: ", args[0], args[1], args[2]);
	};
	
	function start() {
		vm.start();
	}
	
	function run(source, filename) {
		var lexer 		= lexer(source),
			parser    	= parser(lexer),
			ast       	= parser.parseTopLevel(),
			compiler  	= compiler(),
			result    	= compiler.compile(ast);
		
		vm.merge(result.symbols);
		vm.spawn(result.topLevelFn);
	}
	
	return {
		start   : start,
		run     : run
	};
	
}

exports.createContext = createContext;