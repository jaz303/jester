exports.print = function(str) {
	console.log(str);
}

exports.sleep = function(delay) {
	return new Promise(function(resolve, reject) {
		setTimeout(resolve, delay);
	});
}