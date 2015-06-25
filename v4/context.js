module.exports = create;

function create() {

	var tasks = [];
	var activeTask = null;

	function schedule(cb) {
		activeTask.continuation = cb;
		tasks.push(activeTask);
		activeTask = tasks.shift();
		activeTask.continuation();
	}

	function wait(promise, cb) {
		promise.then(function(res) {

		}, function(err) {

		});
	}

	function spawn(callable, args) {
		
	}

	function start(body) {

	}

	var nextCall = null;
	var nextArg = null;

	var ctx = {
		thunk: function(fn, arg) {
			nextCall = fn;
			nextArg = arg;
			return 1;
		},

		isTruthy: function(val) {
			return !!val;
		},
		start: function(mainModule, rootEnv) {
			var res = mainModule.evaluate(
				ctx,
				rootEnv,
				function() { console.log("done"); },
				function(err) { console.error(err); }
			);
			while (res === 1) {
				res = nextCall(nextArg);
			}
		}
	};

	return ctx;

}