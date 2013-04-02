;(function(global, simple) {
  
  var T_FN                = 1;
  
  function Fn() {
    this.__type__ = simple.T_FN;
    this.code = [];
    
    this.minArgs = 0;
    this.maxArgs = 0;
    
    this.constants = [];
    
    this.localNames = {};
    this.numLocals = 0;
  
    this.fnNames = [];
    this.fnCache = [];
  };
  
  Fn.prototype = {
    slotForLocal: function(name) {
      if (this.localNames.hasOwnProperty(name)) {
        return this.localNames[name];
      } else {
        var slot = this.numLocals++;
        this.localNames[name] = slot;
        return slot;
      }
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