var constants = {};

function addFile(file, prefix) {
    var ks = require(file);
    Object.keys(ks).forEach(function(k) {
        constants[prefix + k] = ks[k];
    });
}

addFile('./task_states', 'TASK_STATE_');

module.exports = constants;