;(function(simple, global) {
  
  var domPrettyPrinter = simple.analysis.reducer({
    setup: function() {
      this.source = '';
      this.indent = 0;
    },
    reduce: function() {
      return this.source;
    },
    
    "enter-def": function(node) {
      
    }
    
  });
  
})(simple, this);