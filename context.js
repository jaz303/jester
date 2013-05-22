;(function(global, simple) {
  
  function createContext() {
    
    var vm = simple.createVM();
    
    //
    // Ghetto stdlib
    
    vm.trace = function(vm, task, frame) {
      console.log("tracin'", task, frame);
      console.log(frame.dirtyLocals());
    }
    
    vm.env['random'] = function() {
      return Math.floor(Math.random() * 1000);
    }
    
    vm.env['delay'] = function(args, task, env, vm) {
      
      if (task.state == simple.TASK_RESUMED) {
        task.state = simple.TASK_RUNNABLE;
        return null;
      }
      
      task.state = simple.TASK_BLOCKED;
      setTimeout(function() { vm.resumeTask(task); }, args[0]);
      
    };
    
    vm.env['print'] = function(args) {
      console.log("VM say: ", args[0], args[1], args[2]);
    };
    
    //
    //
    
    function start() {
      vm.start();
    }
    
    function run(source, filename) {
      var lexer     = simple.createLexer(source),
          parser    = simple.createParser(lexer),
          ast       = parser.parseTopLevel(),
          compiler  = new simple.Compiler(),
          result    = compiler.compile(ast);
      
      vm.merge(result.symbols);
      vm.spawn(result.topLevelFn);
    }
    
    return {
      start   : start,
      run     : run
    };
    
  }
  
  simple.createContext = createContext;
  
})(this, simple);