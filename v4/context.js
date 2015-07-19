module.exports = create;

var beget = require('./env').beget;
var define = require('./env').define;
var FunctionInstance = require('./runtime/FunctionInstance');

function create() {

	var CONTINUE		= 1;
	var WAIT 			= 2;
	var EXIT 			= 3;
	var YIELD			= 4;

	var state 			= 'idle';
	var nextTaskId 		= 1;
	var running			= false;
	var nextCall 		= null;
	var nextArg 		= null;
	var activeTask 		= null;
	var runnableTasks 	= [];
	var waitingTasks 	= [];

	function spawnTask(block, env) {
		var task = {
			__jtype: 'task',
			id: nextTaskId++,
			block: block,
			env: env,
			waiters: [],
			thunk: function() {
				return block.evaluate(
					ctx,
					env,
					function() {
						console.log("task ID " + task.id + " exited");
						return EXIT;
					},
					function(err) {
						if (err instanceof Error) {
							console.log("task ID " + task.id + " error:", err);
						} else {
							console.log("task ID " + task.id + " exited");
						}
						return EXIT;
					}
				)
			},
			thunkArg: null
		};
		console.log("task ID " + task.id + " spawned");
		runnableTasks.push(task);
		return task;
	}

	function go() {
		do {
			activeTask = runnableTasks.shift();
			var res = activeTask.thunk(activeTask.thunkArg);
			while (res === CONTINUE) {
				res = nextCall(nextArg);
			}
			if (res === WAIT) {
				waitingTasks.push(activeTask);
			} else if (res === YIELD) {
				runnableTasks.push(activeTask);
			} else if (res === EXIT) {
				activeTask.waiters.forEach(function(cb) { cb(); });
				activeTask.waiters = null;
			}
		} while (runnableTasks.length);
		activeTask = null;
		if (waitingTasks.length) {
			state = 'wait';
		} else {
			state = 'exited';
		}
	}

	var ctx = {
		'void': require('./runtime/void'),
		VOID: require('./runtime/void'),
		globals: {},

		spawn: function(env, fn, args) {
			if (fn) {
				if (fn.__jtype === 'function') {

					//
					// TODO: deal with args properly
					
					if (args.length !== fn.co.params.length) {
						throw new Error("spawn: arity error");
					}
					
					var newEnv = beget(env);

					for (var i = 0; i < args.length; ++i) {
						define(newEnv, fn.co.params[i].name, args[i]);
					}

					return spawnTask(fn.co.body, newEnv);
				}
			}
			throw new Error("spawn: callee is not callable");
		},

		wait: function(promise, cont, err) {
			var thisTask = activeTask;
			promise.then(function(res) {
				thisTask.thunk = cont;
				thisTask.thunkArg = res;
				_requeue();
			}, function(error) {
				thisTask.thunk = err;
				thisTask.thunkArg = error;
				_requeue();
			});
			return WAIT;
			function _requeue() {
				waitingTasks.splice(waitingTasks.indexOf(thisTask), 1);
				runnableTasks.push(thisTask);
				if (state === 'wait') {
					state = 'running';
					go();
				}
			}
		},

		yield: function(cont) {
			activeTask.thunk = cont;
			activeTask.thunkArg = null;
			return YIELD;
		},

		thunk: function(fn, arg) {
			nextCall = fn;
			nextArg = arg;
			return CONTINUE;
		},

		isTruthy: function(val) {
			return !!val;
		},

		start: function(mainModule, rootEnv) {
			if (state !== 'idle') {
				throw new Error("state error: start() can only be called when machine is idle");
			}
			var moduleEnv = beget(rootEnv);

			for (var k in mainModule.scope.symbols) {
				define(moduleEnv, k, new FunctionInstance(mainModule.scope.symbols[k], moduleEnv));
			}

			state = 'starting';
			spawnTask(mainModule.statements, moduleEnv);
			setTimeout(function() {
				state = 'running';
				go();
			}, 0);
		}
	};

	return ctx;

}