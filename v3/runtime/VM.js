var opcodes = exports.opcodes = {};

function op(name, code) {
    code <<= 26;
    opcodes[name] = code;
    return code;
}

var DEFAULT_STACK_SIZE = 16;

var OP_NOP          = op('NOP',         0);
var OP_JMP          = op('JMP',         1);
var OP_LOADK        = op('LOADK',       2);
var OP_PRINT        = op('PRINT',       3);
var OP_YIELD        = op('YIELD',       4);
var OP_TERM         = op('TERM',        5);
var OP_MKFUN        = op('MKFUN',       6);
var OP_SPAWN        = op('SPAWN',       7);
var OP_CALL         = op('CALL',        8);
var OP_RETURN       = op('RETURN',      9);
var OP_ADD          = op('ADD',         10);

// var OP_HALT      = op('HALT',        2);

// var OP_LOADTRUE      = op('LOADTRUE',    4);
// var OP_LOADFALSE     = op('LOADFALSE',   5);
// var OP_ADD           = op('ADD',         6);
// var OP_MOVE      = op('MOVE',        7);
// var OP_MGET      = op('MGET',        8);
// var OP_MSET      = op('MSET',        9);
// var OP_MKFUN         = op('MKFUN',       10);

function mkframe() {
    return { code: null, ip: 0, sp: 0, returnRegister: 0 };
}

function Task(stackSize) {
    this.__jtype = 'task';
    this.stack = new Array(stackSize);
    this.state = 'runnable';
    this.fp = 0;
    this.frames = [ mkframe() ];
}

exports.create = create;
function create() {

    var state = 'stopped';
    var runnableTasks = [];

    function tick() {
        run();
        if (state !== 'stopped') {
            setTimeout(tick, 0);
        }
    }

    function run() {

        if (runnableTasks.length === 0) {
            state = 'stopped'
            return;
        }

        var task    = runnableTasks.shift();
        var stack   = task.stack;
        var frame   = task.frames[task.fp];
        var co      = frame.code;
        var ops     = co.code;
        var mod     = co.module;
        var ip      = frame.ip;
        var sp      = frame.sp;

        for (;;) {
            var ins = ops[ip++];
            switch (ins & 0xFC000000) {
                case OP_NOP:
                    break;
                case OP_JMP:
                    ip = ins & 0x00FFFFFF;
                    break;
                case OP_LOADK:
                    stack[sp + (ins >> 16) & 0xFF] = mod.k[ins & 0xFFFF];
                    break;
                case OP_PRINT:
                    console.log(stack[sp + (ins & 0xFF)]);
                    break;
                case OP_YIELD:
                    runnableTasks.push(task);
                    return;
                case OP_TERM:
                    task.state = 'dead';
                    return;
                case OP_MKFUN:
                    stack[sp + (ins >> 16) & 0xFF] = {
                        __jtype: 'function',
                        code: mod.code[ins & 0xFFFF]
                    };
                    break;
                case OP_SPAWN:
                    // TODO(jwf): when we have closures we'll need to close any upvals referenced
                    // by the spawned function and put them in our stack. Not sure how compatible
                    // this is with what we're doing... :/
                    var fnreg = (ins >> 16) & 0xFF;
                    var nargs = (ins >> 8) & 0xFF;
                    var target = ins & 0xFF;
                    var fn = stack[sp + fnreg];
                    var newTask = stack[sp + target] = new Task(DEFAULT_STACK_SIZE);
                    newTask.frames[0].code = fn.code;
                    for (var i = 0; i < nargs; ++i) {
                        newTask.stack[i] = stack[fnreg + 1 + i];
                    }
                    runnableTasks.push(newTask);
                    break;
                case OP_CALL:
                    frame.ip = ip;
                    var fnreg = (ins >> 16) & 0xFF;
                    var nargs = (ins >> 8) & 0xFF;
                    var fn = stack[sp + fnreg];
                    ++task.fp;
                    if (task.fp === task.frames.length) {
                        task.frames.push(mkframe());
                    }
                    frame = task.frames[task.fp];
                    frame.returnRegister = sp + (ins & 0xFF);
                    co = frame.code = fn.code;
                    ops = co.code;
                    mod = co.module;
                    ip = frame.ip = 0;
                    sp = frame.sp = (sp + fnreg + 1);
                    break;
                case OP_RETURN:
                    stack[frame.returnRegister] = stack[sp + (ins & 0xFF)];
                    frame = task.frames[--task.fp];
                    co = frame.code;
                    ops = co.code;
                    mod = co.module;
                    ip = frame.ip;
                    sp = frame.sp;
                    break;
                case OP_ADD:
                    stack[sp + (ins >> 16) & 0xFF] = stack[sp + (ins >> 8) & 0xFF] + stack[sp + (ins & 0xFF)];
                    break;
                default:
                    throw new Error("unknown opcode: " + (ins & 0xFC000000));
            }
        }

    }

    return {
        start: function(co) {
            state = 'running';
            var initialTask = new Task(DEFAULT_STACK_SIZE);
            initialTask.frames[0].code = co;
            runnableTasks.push(initialTask);
            tick();
        }
    };

}