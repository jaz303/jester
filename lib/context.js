"use strict";

var createVM        = require('./vm').createVM,
    createLexer     = require('./lexer').createLexer,
    createParser    = require('./parser').createParser,
    createCompiler  = require('./compiler').createCompiler,
    taskStates      = require('./task_states'),
    types           = require('./types'),
    readline        = require('readline');

function createContext(vm) {

    vm = vm || createVM();
    
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

        if (task.state === taskStates.RESUMED) {
            task.state = taskStates.RUNNABLE;
            return null;
        }
        
        task.state = taskStates.BLOCKED;
        setTimeout(function() {
            if (task.state !== taskStates.DEAD) {
                vm.resumeTask(task);
            }
        }, args[0]);
        
    };
    
    vm.env['print'] = function(args) {
        var val = args[0];
        if (typeof val !== 'object') {
            console.log(args[0]);
        } else {
            switch (val.__type__) {
                case types.T_FN:
                    console.log("<Function>");
                    break;
                case types.T_TASK:
                    console.log("<Task id=" + val.id + ">");
                    break;
                default:
                    console.log("<Unknown>");
            }
        }
    };

    vm.env['prompt'] = function(args) {
        var prompt = args[0] || "> ";
        process.stdout.write(prompt);
    };

    vm.env['input'] = function(args, task, env, vm) {
        var frame = task.frames[task.fp];

        if (task.state == taskStates.RESUMED) {
            task.state = taskStates.RUNNABLE;
            return frame.z;
        }

        task.state = taskStates.BLOCKED;

        var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        frame.z = null;

        rl.once("line", function(input) {
            frame.z = input;
            rl.close();
        }).once("close", function() {
            vm.resumeTask(task);
        });
    };
    
    function start() {
        vm.start();
    }

    function spawn(fun) {
        return vm.spawn(fun);
    }

    function compile(source, filename) {
        try {
            var lexer       = createLexer(source),
                parser      = createParser(lexer),
                ast         = parser.parseTopLevel(),
                compiler    = createCompiler(),
                result      = compiler.compile(ast);

            vm.merge(result.symbols);

            return result.topLevelFn;
            
        } catch (e) {
            
            console.log(e);
            return null;
        
        }
    }
    
    function run(source, filename) {

        var fun = compile(source, filename);

        if (!fun)
            return null;

        return vm.spawn(fun);

    }

    function killTask(task) {
        vm.killTask(task);
    }

    return {
        compile     : compile,
        start       : start,
        run         : run,
        spawn       : spawn,
        killTask    : killTask,
        env         : vm.env
    };
    
}

exports.createContext = createContext;
