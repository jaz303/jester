"use strict";

var taskStates = require('./task_states');

var T_FN        = 1;
var T_TASK      = 2;
var T_ARRAY     = 3;
var T_COLOR     = 4;

function Fn() {
    this.name = null;
    this.code = [];
    this.sourceMap = [];
    
    this.minArgs = 0;
    this.maxArgs = 0;
    
    this.constants = [];
    
    this.locals = [];
    
    this.fnNames = [];
    this.names = [];
};

Fn.prototype = {
    __type__: T_FN,

    slotForLocal: function(name) {
        var ls = this.locals;
        for (var i = 0; i < ls.length; ++i) {
            if (ls[i] === name) {
                return i;
            }
        }
        ls.push(name);
        return ls.length - 1;
    },
    
    slotForConstant: function(value) {
        for (var i = 0; i < this.constants.length; ++i) {
            if (this.constants[i] === value) {
                return i;
            }
        }
        this.constants.push(value);
        return this.constants.length - 1;
    },
    
    slotForFunctionCall: function(name) {
        for (var i = 0; i < this.fnNames.length; i++) {
            if (name === this.fnNames[i]) {
                return i;
            }
        }
        this.fnNames.push(name);
        return this.fnNames.length - 1;
    },

    slotForName: function(name) {
        for (var i = 0; i < this.names.length; ++i) {
            if (name === this.names[i]) {
                return i;
            }
        }
        this.names.push(name);
        return this.names.length - 1;  
    }
};

function Task(id, stackSize) {
    this.id     = id;                       /* task ID */
    this.stack  = new Array(stackSize);     /* stack */
    this.frames = [],                       /* active frames */
    this.fp     = 1,                        /* point to currently active frame */
    this.state  = taskStates.RUNNABLE,      /* state */
    this.prev   = null,                     /* previous task in queue */
    this.next   = null;                     /* next task in queue */
}

Task.prototype = {
    __type__: T_TASK
}

Task.prototype.stop = function() {

}

Task.prototype.start = function() {
    
}

exports.makeFunction = function() {
    return new Fn();
}

exports.makeTask = function(id, stackSize) {
    return new Task(id, stackSize);
}

exports.makeArray = function() {
    var array = [];
    array.__type__ = T_ARRAY;
    return array;
}

exports.makeColor = function(r, g, b, a) {
    return {
        __type__  : T_COLOR,
        color     : (a << 24) | (r << 16) | (g << 8) | b
    };
}

exports.T_FN    = T_FN;
exports.T_TASK  = T_TASK;
exports.T_ARRAY = T_ARRAY;
exports.T_COLOR = T_COLOR;