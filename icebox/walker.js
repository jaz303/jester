;(function(simple, global) {
  
  var A = simple.AST_NODES,
      I = function(state) { return state; };
  
  simple.createWalker = function(opts) {
    
    if (typeof opts === 'function') {
      opts = {post: opts};
    }
    
    if (!opts.pre)  opts.pre = I;
    if (!opts.post) opts.post = I;
    
    var enterDef      = opts.enterDef       || opts.pre;
    var exitDef       = opts.exitDef        || opts.post;
    var enterIf       = opts.enterIf        || opts.pre;
    var exitIf        = opts.exitIf         || opts.post;
    var enterLoop     = opts.enterLoop      || opts.pre;
    var exitLoop      = opts.exitLoop       || opts.post;
    var enterReturn   = opts.enterReturn    || opts.pre;
    var exitReturn    = opts.exitReturn     || opts.post;
    var enterAssign   = opts.enterAssign    || opts.pre;
    var exitAssign    = opts.exitAssign     || opts.post;
    var enterCall     = opts.enterCall      || opts.pre;
    var exitCall      = opts.exitCall       || opts.post;
    var enterBinOp    = opts.enterBinaryOp  || opts.pre;
    var exitBinOp     = opts.exitBinaryOp   || opts.post;
    var enterUnOp     = opts.enterUnaryOp   || opts.pre;
    var exitUnOp      = opts.exitUnaryOp    || opts.post;
    
    return function walk(node) {
      
      if (Array.isArray(node)) {
        
      }
      
    }
    
  }
  
  
  
  
  simple.createWalker = function(cb) {
    return function walk(node) {
      
      if (Array.isArray(node)) {
        for (var i = 0; i < node.length; ++i) {
          walk(node[i]);
        }
      } else if (typeof node !== 'object' || node === null) {
        console.log("walking: ", node);
      } else {
        switch (node.type) {
          case A.DEF:
            break;
          case A.IF:
            break;
          case A.WHILE:
            break;
          case A.LOOP:
            break;
          case A.RETURN:
            break;
          case A.YIELD:
            break;
          case A.COLOR:
            break;
          case A.ASSIGN:
            break;
          case A.TRACE:
            break;
          case A.IDENT:
            break;
          case A.CALL:
            break;
          case A.BIN_OP:
            break;
          case A.UN_OP:
            break;
            
          case A.YIELD:
          case A.COLOR:
          case A.TRACE:
          case A.IDENT:
            break;
          default:
            throw "unknown AST node type: " + node.type;
        }
      }
    
    }
  }
  
  // 
  // function WalkState() {
  //   this.path = [];
  //   this.control = [];
  //   this.depth = 0;
  // }
  // 
  // WalkState.prototype = {
  //   push: function(node) {
  //     this.path.push(node);
  //     this.control.push({});
  //     this.depth++;
  //   },
  //   pop: function() {
  //     this.path.pop();
  //     this.control.pop();
  //     this.depth--;
  //   },
  //   stop: function() {
  //     
  //   },
  //   breakOut: function() {
  //     
  //   }
  // };
  // 
  // function walker(cb) {
  //   
  //   return function walk(node, state) {
  //     
  //     if (typeof state === 'undefined') {
  //       state = new WalkState;
  //     }
  //     
  //     if (typeof node !== 'object' || node === null) {
  //       cb.call(state, node);
  //     } else {
  //       switch (node.type) {
  //         case 'def':
  //           state.push(node);
  //           cb.call(state, node);
  // 
  //           state.pop();
  //           break;
  //         case 'if':
  //         case 'while':
  //         case 'loop':
  //           state.push(node);
  //           cb.call(state, node);
  //           state.pop();
  //           break;
  //         case 'return':
  //         case 'yield':
  //         default:
  //         
  //       }
  //     }
  //     
  //     
  //     
  //   }
  //   
  //   
  //   
  //   
  //   
  //   
  //   
  //   var defaultWalker = function() { }
  //   if (typeof cb === 'function') {
  //     defaultWalker = cb;
  //     cb = {};
  //   }
  //   
  //   var enterDef      = cb['enter-def']   || defaultWalker,
  //       exitDef       = cb['exit-def']    || defaultWalker,
  //       enterWhile    = cb['enter-while'] || defaultWalker,
  //       exitWhile     = cb['exit-while']  || defaultWalker,
  //       enterLoop     = cb['enter-loop']  || defaultWalker,
  //       exitLoop      = cb['exit-loop']   || defaultWalker,
  //       enterIf       = cb['enter-if']    || defaultWalker,
  //       exitIf        = cb['exit-if']     || defaultWalker,
  //       onValue       = cb['value']       || defaultWalker;
  //   
  //   var handlers = {};
  //   // TODO: setup handlers
  //   
  //   return function walk(node, state) {
  //     
  //     state = state || {};
  //     
  //     if (node === true || node === false || typeof node === 'number' || typeof node === 'string') {
  //       onValue.call(state, node, state);
  //     } else {
  //       switch (node.type) {
  //         case 'def':
  //           enterDef.call(state, node, state);
  //           node.body.forEach(function(stmt) { walk(stmt, state); });
  //           exitDef.call(state, node, state);
  //           break;
  //         case 'loop':
  //           enterLoop.call(state, node, state);
  //           node.body.forEach(function(stmt) { walk(stmt, state); });
  //           exitLoop.call(state, node, state);
  //           break;
  //       }
  //     }
  //     
  //   }
  //   
  // }
  // 
  // 
  // 
  // function walk(node, cb) {
  //   
  //   switch (node.type) {
  //     case 'def':
  //   }
  //   
  // }
  // 
  // 
  // function reducer(opts) {
  //   var w = walker(opts),
  //       r = opts.reduce || function(n) { return n; };
  //   return function(node) {
  //     return r.call(w(node));
  //   }
  // };
  // 
  // 
  // //
  // //
  // 
  // var localsFinder = reducer({
  //   setup: function() {
  //     this.inFunction = false;
  //     this.locals = {};
  //   },
  //   walk: function(node, self) {
  //     if (node.type === 'assign') {
  //       this.locals[node.name] = true;
  //     } else if (node.type === 'def') {
  //       if (this.inFunction) {
  //         this.stop(); // don't descend into another function
  //       } else {
  //         node.parameters.forEach(function(p) {
  //           self.locals[p] = true;
  //         });
  //         this.inFunction = true;
  //       }
  //     }
  //   },
  //   reduce: function() {
  //     return Object.keys(this.locals);
  //   }
  // });
  // 
  // localsFinder
  // 
  // 
  // 
  // 
  // var findLocals = walker(function(node) {
  //   
  // }, function() {
  //   this.locals = {};
  // });
  // 
  // findLocals()
  
})(simple, this);