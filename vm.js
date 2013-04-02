;(function(global, simple) {
  
  var DEFAULT_STACK_SIZE  = 2048;
  
  simple.opcodes = {};
  
  var _t = 1, t = function(name) {
    var opcode = (_t++) << 24;
    simple.opcodes[name] = opcode;
    return opcode;
  };
  
  var OP_PUSHC    = t('PUSHC'),     /* Push Constant  (23:0 - constant slot) */
      OP_PUSHL    = t('PUSHL'),     /* Push Local     (23:0 - local slot) */
      OP_PUSHT    = t('PUSHT'),     /* Push true */
      OP_PUSHF    = t('PUSHF'),     /* Push false */
      OP_SETL     = t('SETL'),      /* Set Local      (23:0 - local slot) */
      OP_CALL     = t('CALL'),      /* Call           (23:16 - nargs, 15:0 - fn slot) */
      OP_RET      = t('RET'),       /* Return */
      OP_POP      = t('POP'),       /* Pop TOS */
      OP_ADD      = t('ADD'),
      OP_SUB      = t('SUB'),
      OP_MUL      = t('MUL'),
      OP_DIV      = t('DIV'),
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
    
    function exec(task) {
      var frame = task.frames[task.fp],
          fn    = frame.fn,
          code  = fn.code;

      for (;;) {
        var op = code[frame.ip++];
        
        switch (op & 0xff000000) {
          case OP_PUSHC:
            task.stack[frame.sp++] = fn.constants[op & 0x00ffffff];
            break;
          case OP_PUSHL:
            task.stack[frame.sp++] = task.stack[frame.bp + (op & 0x00ffffff)];
            break;
          case OP_PUSHT:
            task.stack[frame.sp++] = true;
            break;
          case OP_PUSHF:
            task.stack[frame.sp++] = false;
            break;
          case OP_SETL:
            task.stack[frame.bp + (op & 0x00ffffff)] = task.stack[--frame.sp];
            break;
          case OP_CALL:
          
            var fnix    = (op & 0x0000ffff),
                nargs   = (op & 0x00ff0000) >> 16,
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
          case OP_TRACE:
            if (vm.trace) {
              vm.trace(vm, task, frame);
              task.stack[frame.sp++] = true;
            } else {
              task.stack[frame.sp++] = false;
            }
            break;
          case OP_EXIT:
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
        fp        : 0,                      /* pointer to currently active */
      };
      
      task.frames[0] = {fn: TaskWrapper, sp: 0, bp: 0, ip: 0};
      task.frames[1] = {fn: fn, sp: 0, bp: 0, ip: 0};
      task.fp = 1;
      
      var frame = task.frames[1];
      
      var i = 0;
      while (i < args.length) {
        task.stack[frame.sp++] = args[i];
        ++i;
      }
      
      while (i < fn.numLocals) {
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