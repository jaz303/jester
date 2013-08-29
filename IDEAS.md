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


Python "jump if true/false" opcodes don't pop TOS - why is this?!

There should be a way of marking functions as "safe", i.e. that they have no side effects.
Could use "fun" and "def". Means that test execution environment knows it can show invocations.


## Function Scope

All arguments become local variables.
Any identifier which is assigned to becomes a local variable.

local, global statements could be used.

this will allow functions as values, too

LOAD_SYMBOL