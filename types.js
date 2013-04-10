;(function(global, simple) {
  
  var T_FN                = 1;
  
  function Fn() {
    this.__type__ = simple.T_FN;
    this.code = [];
    
    this.minArgs = 0;
    this.maxArgs = 0;
    
    this.constants = [];
    
    this.locals = [];
  
    this.fnNames = [];
    this.fnCache = [];
  };
  
  Fn.prototype = {
    slotForLocal: function(name) {
      var ls = this.locals;
      for (var i = 0; i < ls.length; ++i) {
        if (ls[i] === name) {
          return i;
        }
      }
      ls.push(name);
      return ls.length - 1;
    },
    
    slotForConstant: function(value) {
      for (var i = 0; i < this.constants.length; ++i) {
        if (this.constants[i] === value) {
          return i;
        }
      }
      this.constants.push(value);
      return this.constants.length - 1;
    },
    
    slotForFunctionCall: function(name) {
      for (var i = 0; i < this.fnNames.length; i++) {
        if (name === this.fnNames[i]) {
          return i;
        }
      }
      this.fnNames.push(name);
      this.fnCache.push(null);
      return this.fnNames.length - 1;
    }
  };
  
  //
  // Expose
  
  simple.Fn = Fn;
  
  simple.T_FN         = T_FN;
  
})(this, simple)