;(function(global, simple) {
  
  function Frame(fn, task) {
    this.fn = fn;
    this.task = task;
    this.dirty = 0;
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
  
  simple.opcodes = {};
  
  var _t = 1, t = function(name) {
    var opcode = (_t++);
    simple.opcodes[name] = opcode;
    return opcode;
  };
  
  var OP_PUSHC    = t('PUSHC'),     /* Push Constant  (31:8 - constant slot) */
      OP_PUSHI    = t('PUSHI'),     /* Push Immediate (31:8 - integer value) */
      OP_PUSHL    = t('PUSHL'),     /* Push Local     (31:8 - local slot) */
      OP_PUSHT    = t('PUSHT'),     /* Push true */
      OP_PUSHF    = t('PUSHF'),     /* Push false */
      OP_SETL     = t('SETL'),      /* Set Local      (31:8 - local slot) */
      OP_CALL     = t('CALL'),      /* Call           (31:16 - fn slot, 15:8 - nargs) */
      OP_RET      = t('RET'),       /* Return */
      OP_POP      = t('POP'),       /* Pop TOS */
      OP_ADD      = t('ADD'),
      OP_SUB      = t('SUB'),
      OP_MUL      = t('MUL'),
      OP_DIV      = t('DIV'),
      OP_LT       = t('LT'),
      OP_LE       = t('LE'),
      OP_GT       = t('GT'),
      OP_GE       = t('GE'),
      OP_JMP      = t('JMP'),       /* Jump           (31:8 - offset) */
      OP_JMPT     = t('JMPT'),      /* Jump if True   (31:8 - offset) */
      OP_JMPF     = t('JMPF'),      /* Jump if False  (31:8 - offset) */
      OP_JMPA     = t('JMPA'),      /* Jump Absolute  (31:8 - target) */
      OP_TRACE    = t('TRACE'),     /* Trace */
      OP_EXIT     = t('EXIT');      /* Exit task */
      
  // TaskWrapper is a shim placed around every task that is spawned
  // Ensures task exits after main task function returns
  var TaskWrapper = new simple.Fn();
  TaskWrapper.code = [OP_EXIT];
  
  function createVM() {
    
    var env = {};
    
    var vm = {
      trace: null
    };
    
    function truthy_p(v) {
      return !(v === false || v === null);
    }
    
    function exec(task) {
      var frame = task.frames[task.fp],
          fn    = frame.fn,
          code  = fn.code;

      for (;;) {
        var op = code[frame.ip++];
        
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
          case OP_PUSHT:
            task.stack[frame.sp++] = true;
            break;
          case OP_PUSHF:
            task.stack[frame.sp++] = false;
            break;
          case OP_SETL:
            var local = (op >> 8);
            task.stack[frame.bp + local] = task.stack[--frame.sp];
            frame.dirty |= (1 << local);
            break;
          case OP_CALL:
          
            var fnix    = (op >> 16),
                nargs   = (op >> 8) & 0xFF,
                callfn  = env[fn.fnNames[fnix]];
                
            if (typeof callfn == 'function') {
              try {
                var res = callfn(task.stack.slice(frame.sp - nargs, frame.sp), task, env);
                frame.sp -= nargs;
                task.stack[frame.sp++] = res;
                break;
              } catch (e) {
                // TODO: log error
              }
            } else if (callfn && callfn.__type__ == simple.T_FN) {
              console.log(callfn);
              throw "can't handle native function call!";
              // TODO: function call
              break;
            }
            
            // not a function!
            // TODO: kill task
            
            break;
          case OP_RET:
            frame = task.frames[--task.fp];
            fn = frame.fn;
            code = fn.code;
            break;
          case OP_POP:
            --frame.sp;
            break;
          case OP_ADD:
            var l = task.stack[frame.sp - 2],
                r = task.stack[frame.sp - 1];
            if (typeof l == 'number' && typeof r == 'number') {
              task.stack[(frame.sp--) - 2] = (l + r);
            } else {
              throw "ADD - args non-numeric";
            }
            break;
          case OP_SUB:
            var l = task.stack[frame.sp - 2],
                r = task.stack[frame.sp - 1];
            if (typeof l == 'number' && typeof r == 'number') {
              task.stack[(frame.sp--) - 2] = (l - r);
            } else {
              throw "SUB - args non-numeric";
            }
            break;
          case OP_MUL:
            var l = task.stack[frame.sp - 2],
                r = task.stack[frame.sp - 1];
            if (typeof l == 'number' && typeof r == 'number') {
              task.stack[(frame.sp--) - 2] = (l * r);
            } else {
              throw "MUL - args non-numeric";
            }
            break;
          case OP_DIV:
            var l = task.stack[frame.sp - 2],
                r = task.stack[frame.sp - 1];
            if (typeof l == 'number' && typeof r == 'number') {
              task.stack[(frame.sp--) - 2] = (l / r);
            } else {
              throw "DIV - args non-numeric";
            }
            break;
          case OP_LT:
            var l = task.stack[frame.sp - 2],
                r = task.stack[frame.sp - 1];
            if (typeof l == 'number' && typeof r == 'number') {
              task.stack[(frame.sp--) - 2] = (l < r);
            } else {
              throw "LT - args non-numeric";
            }
            break;
          case OP_LE:
            var l = task.stack[frame.sp - 2],
                r = task.stack[frame.sp - 1];
            if (typeof l == 'number' && typeof r == 'number') {
              task.stack[(frame.sp--) - 2] = (l <= r);
            } else {
              throw "LE - args non-numeric";
            }
            break;
          case OP_GT:
            var l = task.stack[frame.sp - 2],
                r = task.stack[frame.sp - 1];
            if (typeof l == 'number' && typeof r == 'number') {
              task.stack[(frame.sp--) - 2] = (l > r);
            } else {
              throw "GT - args non-numeric";
            }
            break;
          case OP_GE:
            var l = task.stack[frame.sp - 2],
                r = task.stack[frame.sp - 1];
            if (typeof l == 'number' && typeof r == 'number') {
              task.stack[(frame.sp--) - 2] = (l >= r);
            } else {
              throw "GE - args non-numeric";
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
          case OP_EXIT:
            console.log('task exit!');
            // TODO: remove this task from the task queue
            return;
        }
      }
    }
    
    function spawn(fn, args, opts) {
      args = args || [];
      opts = opts || {};
      
      var stackSize = opts.stackSize || DEFAULT_STACK_SIZE;
      
      var task = {
        stack     : new Array(stackSize),   /* stack */                                                                                                 
        frames    : [],                     /* active frames */
        fp        : 1,                      /* pointer to currently active */
      };
      
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
      
      exec(task);
    }
    
    function tick() {
      
    }
    
    function gc() {
      // TODO: iterate over each task
      // TODO: nullify frames
      // TODO: nullify stack above sp
    }
    
    vm.env    = env;
    vm.spawn  = spawn;
    vm.tick   = tick;
    vm.gc     = gc;
    
    return vm;
  }
  
  simple.createVM = createVM;
  
})(this, simple);