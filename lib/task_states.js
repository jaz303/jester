"use strict";

exports.RUNNABLE   = 1; /* default state; task is runnable */
exports.DEAD       = 2; /* task is dead. done. gone. */
exports.BLOCKED    = 3; /* task blocked waiting on something e.g. IO, delay */
exports.RESUMED    = 4; /* task has just resumed. for use in native functions */