"use strict";

var types           = require('./types'),
    makeFunction    = types.makeFunction,
    makeTask        = types.makeTask,
    taskStates      = require('./task_states');

function TaskList() {
    this.curr = null;
}

function tasklist_add(list, task) {
    if (list.curr === null) {
        task.next = task;
        task.prev = task;
        list.curr = task;
    } else {
        var c = list.curr;
        c.prev.next = task;
        task.next = c;
        task.prev = c.prev;
        c.prev = task;
    }
}

function tasklist_remove(list, task) {
    if (task.next === task) {
        list.curr = null;
    } else {
        task.prev.next = task.next;
        task.next.prev = task.prev;
        if (list.curr === task) {
            list.curr = task.next;
        }
    }
    task.prev = null;
    task.next = null;
}

function tasklist_next(list) {
    list.curr = list.curr.next;
}

function tasklist_curr(list) {
    return list.curr;
}

function Frame(fn, task) {
    this.fn     = fn;     /* function this frame is executing */
    this.task   = task;   /* task this frame belongs to */
    this.dirty  = 0;      /* bitmask of locals modified since last `trace` */
    this.z      = false;  /* last evaluated value */
    // sp, bp, ip
}

Frame.prototype = {
    localNames: function() {
        return this.fn.locals;
    },
    
    locals: function() {
        var ls = this.fn.locals, out = {};
        for (var i = 0; i < ls.length; ++i) {
            out[ls[i]] = this.task.stack[this.bp + i];
        }
        return out;
    },
    
    dirtyLocalNames: function() {
        var ls = this.fn.locals, out = [];
        for (var i = 0; i < ls.length; ++i) {
            if (this.dirty & (1 << i)) {
                out.push(ls[i]);
            }
        }
        return out;
    },
    
    dirtyLocals: function() {
        var ls = this.fn.locals, out = {};
        for (var i = 0; i < ls.length; ++i) {
            if (this.dirty & (1 << i)) {
                out[ls[i]] = this.task.stack[this.bp + i];
            }
        }
        return out;
    },
};

var DEFAULT_STACK_SIZE = 2048;

var opcodes = {},
    opcodeMeta = {};

var _t = 1, t = function(name, desc, operands) {
    var opcode = (_t++);
    opcodes[name] = opcode;
    opcodeMeta[opcode] = {name: name, desc: desc, operands: operands || []};
    return opcode;
};

var OP_PUSHC    = t('PUSHC',    'Push constant',            [31, 8, 'constant']),
    OP_PUSHI    = t('PUSHI',    'Push immediate',           [31, 8, 'integer']),
    OP_PUSHL    = t('PUSHL',    'Push local',               [31, 8, 'local']),
    OP_PUSHG    = t('PUSHG',    'Push global',              [31, 16, 'name']),
    OP_PUSHT    = t('PUSHT',    'Push true'),
    OP_PUSHF    = t('PUSHF',    'Push false'),
    OP_PUSHN    = t('PUSHN',    'Push null'),
    OP_PUSHZ    = t('PUSHZ',    'Push last evaluated value'),
    OP_SETZ     = t('SETZ',     'Set last evaluated value'),
    OP_SETL     = t('SETL',     'Set local',                [31, 8, 'local']),
    OP_SETG     = t('SETG',     'Set global',               [31, 16, 'name']),
    OP_CALL     = t('CALL',     'Call function',            [31, 16, 'fn', 15, 8, 'nargs']),
    OP_SPAWN    = t('SPAWN',    'Spawn new thread',         [31, 16, 'fn', 15, 8, 'nargs']),
    OP_RET      = t('RET',      'Return'),
    OP_POP      = t('POP',      'Pop TOS'),
    OP_ADD      = t('ADD',      'Add'),
    OP_SUB      = t('SUB',      'Sub'),
    OP_MUL      = t('MUL',      'Multiply'),
    OP_DIV      = t('DIV',      'Divide'),
    OP_EQ       = t('EQ',       'Equals check'),
    OP_NEQ      = t('NEQ',      'Not-equals check'),
    OP_LT       = t('LT',       'Less-than check'),
    OP_LE       = t('LE',       'Less-than-or-equal check'),
    OP_GT       = t('GT',       'Greater-than check'),
    OP_GE       = t('GE',       'Greater-than-or-equal check'),
    OP_JMP      = t('JMP',      'Jump',                     [31, 8, 'roffset']),
    OP_JMPT     = t('JMPT',     'Jump if true',             [31, 8, 'roffset']),
    OP_JMPF     = t('JMPF',     'Jump if false',            [31, 8, 'roffset']),
    OP_JMPT_OP  = t('JMPT_OP',  'Jump if true or pop',      [31, 8, 'roffset']),
    OP_JMPF_OP  = t('JMPF_OP',  'Jump if false or pop',     [31, 8, 'roffset']),
    OP_JMPA     = t('JMPA',     'Jump absolute',            [31, 8, 'aoffset']),
    OP_TRACE    = t('TRACE',    'Trace'),
    OP_YIELD    = t('YIELD',    'Yield'),
    OP_EVAL     = t('EVAL',     'Evaluate code'),
    OP_EXIT     = t('EXIT',     'Exit task');
        
var TASK_RUNNABLE   = taskStates.RUNNABLE,
    TASK_DEAD       = taskStates.DEAD,
    TASK_BLOCKED    = taskStates.BLOCKED,
    TASK_RESUMED    = taskStates.RESUMED;
        
var VM_STOPPED      = 1,
    VM_RUNNING      = 2,
    VM_PAUSED       = 3;
        
// TaskWrapper is a shim placed around every task that is spawned
// Ensures task exits after main task function returns
var TaskWrapper = makeFunction();
TaskWrapper.code = [OP_EXIT];

function createVM() {
    
    var vm = {
        trace: null,
        state: VM_STOPPED,
        runnable: new TaskList(),
        blocked: new TaskList(),
        env: {},
        globals: {}
    };
    
    var nextTaskId = 1;
    
    var env = vm.env, globals = vm.globals;
    
    function runtimeError(task, message) {
        task.state = TASK_DEAD;
        var frame = task.frames[task.fp];
        console.log("Runtime error in task " + task.id + " at line " + frame.fn.sourceMap[frame.ip-1] + ": " + message);
    }
    
    function truthy_p(v) {
        return !(v === false || v === null);
    }
    
    function eq_p(l, r) {
        if (l === r) {
            return true;
        }
        
        if (l.__type__ === types.T_COLOR && r.__type__ === types.T_COLOR) {
            return l.color === r.color;
        }
        
        return false;
    }
    
    function exec(task) {
        var frame   = task.frames[task.fp],
            fn      = frame.fn,
            code    = fn.code,
            fetch   = function () { return code[frame.ip++]; },
            next_op = fetch;

        for (;;) {
            var op = next_op();

            // console.log(opcodeMeta[op & 0xFF].name);
            
            switch (op & 0x000000FF) {
                case OP_PUSHC:
                    task.stack[frame.sp++] = fn.constants[op >> 8];
                    break;
                case OP_PUSHI:
                    task.stack[frame.sp++] = (op >> 8);
                    break;
                case OP_PUSHL:
                    task.stack[frame.sp++] = task.stack[frame.bp + (op >> 8)];
                    break;
                case OP_PUSHG:
                    var gname = fn.names[op >> 16];
                    task.stack[frame.sp++] = (gname in globals) ? globals[gname] : null;
                    break;
                case OP_PUSHT:
                    task.stack[frame.sp++] = true;
                    break;
                case OP_PUSHF:
                    task.stack[frame.sp++] = false;
                    break;
                case OP_PUSHN:
                    task.stack[frame.sp++] = null;
                    break;
                case OP_PUSHZ:
                    task.stack[frame.sp++] = frame.z;
                    break;
                case OP_SETZ:
                    frame.z = task.stack[--frame.sp];
                    break;
                case OP_SETL:
                    // Note: this opcode does NOT pop the stack
                    // That's because it's currently only used when compiling the assignment
                    // operator - which evaluates to its rval-  so the easiest thing to do is
                    // just preserve the stack as-is.
                    var local = (op >> 8);
                    task.stack[frame.bp + local] = task.stack[frame.sp-1];
                    frame.dirty |= (1 << local);
                    break;
                case OP_SETG:
                    // Again, stack is not popped
                    globals[fn.names[op >> 16]] = task.stack[frame.sp-1];
                    break;
                case OP_CALL:
                
                    var fnix    = (op >> 16),
                        nargs   = (op >> 8) & 0xFF,
                        callfn  = env[fn.fnNames[fnix]];
                            
                    if (typeof callfn == 'function') {
                        try {
                            var res = callfn(task.stack.slice(frame.sp - nargs, frame.sp), task, env, vm);
                            if (task.state == TASK_BLOCKED) {
                                // task has blocked for whatever reason.
                                // backtrack one instruction so native function will be called again when
                                // task is resumed. native function must detect state == TASK_RESUMED, set
                                // task state to TASK_RUNNABLE, and return a value as normal
                                // BUG: if the function is redefined before the function resumes, the new
                                // version of the function will be called the second time around. probably
                                // better to have a flag in the VM saying we're blocked in a native call
                                // and stash a direct pointer to that function...
                                --frame.ip;
                                return;
                            } else if (task.state == TASK_DEAD) {
                                return;
                            } else {
                                frame.sp -= nargs;
                                task.stack[frame.sp++] = res;
                            }
                            break;
                        } catch (e) {
                            // TODO: log error
                        }
                    } else if (callfn && callfn.__type__ == types.T_FN) {
                        if (nargs != callfn.minArgs) {
                            throw "invalid number of args";
                        }
                        
                        frame.sp -= nargs;
                        
                        var newFrame = new Frame(callfn, task);
                        newFrame.bp = frame.sp;
                        newFrame.sp = frame.sp + callfn.locals.length;
                        newFrame.ip = 0;
                        
                        task.frames[++task.fp] = newFrame;
                        
                        frame = newFrame;
                        fn = frame.fn;
                        code = fn.code;
                        
                        break;
                    } else {
                        return runtimeError(task, "'" + callfn + "' is not a function");
                    }

                    break;
                
                case OP_SPAWN:

                    var fnix    = (op >> 16),
                        nargs   = (op >> 8) & 0xFF,
                        callfn  = env[fn.fnNames[fnix]];

                    if (callfn && callfn.__type__ == types.T_FN) {
                        
                        if (nargs != callfn.minArgs) {
                            throw "invalid number of args";
                        }

                        frame.sp -= nargs;
                        var spawnedTask = spawn(callfn, task.stack.slice(frame.sp, frame.sp + nargs));
                        task.stack[frame.sp++] = spawnedTask;

                    } else {
                        return runtimeError(task, "'" + callfn + "' is not a function");
                    }

                    break;
                
                case OP_RET:
                    var retVal = task.stack[frame.sp-1];
                    task.stack[task.frames[--task.fp].sp++] = retVal;
                    frame = task.frames[task.fp];
                    fn = frame.fn;
                    code = fn.code;
                    break;

                case OP_EVAL:
                    var value = task.stack[frame.sp-1],
                        eval_ip = 0,
                        eval_code = [];

                    try {
                        var lexer       = require('./lexer').createLexer(value),
                            parser      = require('./parser').createParser(lexer),
                            ast         = parser.parseTopLevel(),
                            compiler    = require('./compiler').createCompiler(),
                            result      = compiler.compileForEval(ast, frame.fn);

                        vm.merge(result.symbols);

                        eval_code = result.code;

                    } catch (e) {

                        return runtimeError(task, "Could not evaluate code '" + value + "': " + e);

                    }

                    next_op = function () {
                        if (eval_ip < eval_code.length) {
                            return eval_code[eval_ip++];
                        } else {
                            next_op = fetch;
                            return next_op();
                        }
                    }

                    break;

                case OP_POP:
                    --frame.sp;
                    break;
                case OP_EQ:
                    var l = task.stack[frame.sp - 2],
                        r = task.stack[frame.sp - 1];
                    task.stack[(frame.sp--) - 2] = eq_p(l, r);
                    break;
                case OP_NEQ:
                    var l = task.stack[frame.sp - 2],
                        r = task.stack[frame.sp - 1];
                    task.stack[(frame.sp--) - 2] = !eq_p(l, r);
                    break;
                case OP_ADD:
                    var l = task.stack[frame.sp - 2],
                        r = task.stack[frame.sp - 1];
                    if (typeof l == 'number' && typeof r == 'number') {
                        task.stack[(frame.sp--) - 2] = (l + r);
                    } else {
                        return runtimeError(task, "ADD - args non-numeric");
                    }
                    break;
                case OP_SUB:
                    var l = task.stack[frame.sp - 2],
                        r = task.stack[frame.sp - 1];
                    if (typeof l == 'number' && typeof r == 'number') {
                        task.stack[(frame.sp--) - 2] = (l - r);
                    } else {
                        return runtimeError(task, "SUB - args non-numeric");
                    }
                    break;
                case OP_MUL:
                    var l = task.stack[frame.sp - 2],
                        r = task.stack[frame.sp - 1];
                    if (typeof l == 'number' && typeof r == 'number') {
                        task.stack[(frame.sp--) - 2] = (l * r);
                    } else {
                        return runtimeError(task, "MUL - args non-numeric");
                    }
                    break;
                case OP_DIV:
                    var l = task.stack[frame.sp - 2],
                        r = task.stack[frame.sp - 1];
                    if (typeof l == 'number' && typeof r == 'number') {
                        task.stack[(frame.sp--) - 2] = (l / r);
                    } else {
                        return runtimeError(task, "DIV - args non-numeric");
                    }
                    break;
                case OP_LT:
                    var l = task.stack[frame.sp - 2],
                        r = task.stack[frame.sp - 1];
                    if (typeof l == 'number' && typeof r == 'number') {
                        task.stack[(frame.sp--) - 2] = (l < r);
                    } else {
                        return runtimeError(task, "LT - args non-numeric");
                    }
                    break;
                case OP_LE:
                    var l = task.stack[frame.sp - 2],
                        r = task.stack[frame.sp - 1];
                    if (typeof l == 'number' && typeof r == 'number') {
                        task.stack[(frame.sp--) - 2] = (l <= r);
                    } else {
                        return runtimeError(task, "LE - args non-numeric");
                    }
                    break;
                case OP_GT:
                    var l = task.stack[frame.sp - 2],
                        r = task.stack[frame.sp - 1];
                    if (typeof l == 'number' && typeof r == 'number') {
                        task.stack[(frame.sp--) - 2] = (l > r);
                    } else {
                        return runtimeError(task, "GT - args non-numeric");
                    }
                    break;
                case OP_GE:
                    var l = task.stack[frame.sp - 2],
                        r = task.stack[frame.sp - 1];
                    if (typeof l == 'number' && typeof r == 'number') {
                        task.stack[(frame.sp--) - 2] = (l >= r);
                    } else {
                        return runtimeError(task, "GE - args non-numeric");
                    }
                    break;
                case OP_JMP:
                    frame.ip += (op >> 8);
                    break;
                case OP_JMPT:
                    var v = task.stack[--frame.sp];
                    if (truthy_p(v)) {
                        frame.ip += (op >> 8);
                    }
                    break;
                case OP_JMPF:
                    var v = task.stack[--frame.sp];
                    if (!truthy_p(v)) {
                        frame.ip += (op >> 8);
                    }
                    break;
                case OP_JMPT_OP:
                    if (truthy_p(task.stack[frame.sp - 1])) {
                        frame.ip += (op >> 8);
                    } else {
                        --frame.sp;
                    }
                    break;
                case OP_JMPF_OP:
                    if (truthy_p(task.stack[frame.sp - 1])) {
                        --frame.sp;
                    } else {
                        frame.ip += (op >> 8);
                    }
                    break;
                case OP_JMPA:
                    frame.ip = (op >> 8);
                    break;
                case OP_TRACE:
                    if (vm.trace) {
                        vm.trace(vm, task, frame);
                    }
                    frame.dirty = 0;
                    task.stack[frame.sp++] = true;
                    break;
                case OP_YIELD:
                    return;
                case OP_EXIT:
                    task.state = TASK_DEAD;
                    return;
            }
        }
    }
    
    function spawn(fn, args, opts) {
        args = args || [];
        opts = opts || {};
        
        var task = makeTask(nextTaskId++, opts.stackSize || DEFAULT_STACK_SIZE);
        
        task.frames[0] = new Frame(TaskWrapper, task);
        task.frames[0].sp = 0;
        task.frames[0].bp = 0;
        task.frames[0].ip = 0;
        
        task.frames[1] = new Frame(fn, task);
        task.frames[1].sp = 0;
        task.frames[1].bp = 0;
        task.frames[1].ip = 0;
        
        var frame = task.frames[1];
        
        var i = 0;
        while (i < args.length) {
            task.stack[frame.sp++] = args[i];
            ++i;
        }
        
        while (i < fn.locals.length) {
            task.stack[frame.sp++] = null;
            ++i;
        }
        
        tasklist_add(vm.runnable, task);
        if (vm.state == VM_PAUSED)
            setTimeout(resume, 0);

        return task;
    }
    
    function isRunning() {
        return vm.state != VM_STOPPED;
    }
    
    function resumeTask(task) {
        if (task.state != TASK_BLOCKED)
            throw "StateError: task to resume must be blocked";
        
        task.state = TASK_RESUMED;
        
        tasklist_remove(vm.blocked, task);
        tasklist_add(vm.runnable, task);
        
        if (vm.state == VM_PAUSED)
            resume();
    }
    
    function resume() {
        
        if (vm.state == VM_RUNNING)
            return;
        
        vm.state = VM_RUNNING;
        
        function tick() {
            
            var task = tasklist_curr(vm.runnable);
            
            if (!task) {
                vm.state = VM_PAUSED;
                return;
            }
            
            exec(task);
            
            if (task.state == TASK_RUNNABLE) {
                tasklist_next(vm.runnable);
            } else if (task.state == TASK_DEAD) {
                tasklist_remove(vm.runnable, task);
            } else if (task.state == TASK_BLOCKED) {
                tasklist_remove(vm.runnable, task);
                tasklist_add(vm.blocked, task);
            } else {
                console.log(task);
                throw 'illegal task state after execution!';
            }
            
            setTimeout(tick, 0);
            
        }
        
        tick();
    
    }
    
    function start() {
        if (isRunning()) return;
        vm.state = VM_PAUSED;
        resume();
    }

    function killTask(task) {
        if (task.state === TASK_RUNNABLE || task.state === TASK_RESUMED) {
            tasklist_remove(vm.runnable, task);
        } else if (task.state === TASK_BLOCKED) {
            tasklist_remove(vm.blocked, task);
        }
        task.state = TASK_DEAD;
    }
    
    function gcTask(task) {
        var frames = task.frames;
        
        for (var i = task.fp + 1, len = frames.length; i < len; ++i) {
            frames[i] = null;
        }
        
        var stack = task.stack, sp = frames[task.fp].sp;
        while (sp < stack.length) {
            stack[sp++] = undefined;
        }
    }
    
    function gc() {
        var task;
        
        task = vm.runnable;
        while (task) gcTask(task), task = task.next;
        
        task = vm.blocked;
        while (task) gcTask(task), task = task.next;
    }
    
    function merge(symbols) {
        for (var k in symbols) {
            env[k] = symbols[k];
        }
    }
    
    vm.spawn      = spawn;
    vm.start      = start;
    vm.gc         = gc;
    vm.resumeTask = resumeTask;
    vm.killTask   = killTask;
    vm.merge      = merge;
    
    return vm;
}

exports.createVM        = createVM;
exports.opcodes         = opcodes;
exports.opcodeMeta      = opcodeMeta;
