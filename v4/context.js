module.exports = create;

var beget = require('./env').beget;
var define = require('./env').define;

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
						console.log("task ID " + task.id + " error:", err);
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
		spawn: function(env, fn, args) {
			if (fn) {
				if (fn.__jtype === 'function') {
					if (args.length !== fn.args.length) {
						throw new Error("spawn: arity error");
					}
					var newEnv = beget(env);
					for (var i = 0; i < args.length; ++i) {
						define(newEnv, fn.args[i], args[i]);
					}
					return spawnTask(fn.body, newEnv);
				}
			}
			throw new Error("spawn: callee is not callable");
		},

		wait: function(promise, cont, err) {
			var thisTask = activeTask;
			waitingTasks.push(thisTask);
			promise.then(function(res) {
				thisTask.nextCall = cont;
				thisTask.nextArg = res;
				_requeue();
			}, function(error) {
				thisTask.nextCall = err;
				thisTask.nextArg = error;
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
			return 1;
		},

		isTruthy: function(val) {
			return !!val;
		},

		start: function(mainModule, rootEnv) {
			if (state !== 'idle') {
				throw new Error("state error: start() can only be called when machine is idle");
			}
			state = 'starting';
			spawnTask(mainModule.block, rootEnv);
			setTimeout(function() {
				state = 'running';
				go();
			}, 0);
		}
	};

	return ctx;

}