# Ideas

    var context = simple.createContext();
    context.compile(script, filename);

    context.getEnv(k);
    context.setEnv(k, v);

    // need some notion of the "main" task/entry point

    var vm = context.getVM();
    vm.start();

    task = spawn foo, 1, 2
    yield

Need to work out the final scoping rules and implement them in the parser/compiler.

  * will need a dual-pass thing
  * this will probably require a tree walker
