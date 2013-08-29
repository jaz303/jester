;(function(simple, global) {
  
  INDENT = "  ";
  
  function toSource(ast) {
    if (ast.type === A.COLOR) {
      return '#' + ast.r.toString(16) + ast.g.toString(16) + ast.b.toString(16) + ast.a.toString(16);
    } else {
      return simple.stringForSimpleValue(ast);
    }
  }
  
  function statementIsMultiLine(ast) {
    return ast.type === A.DEF
            || ast.type === A.IF
            || ast.type === A.WHILE
            || ast.type === A.LOOP;
  }
  
  simple.pp = function(ast) {
    
    var buffer = "",
        indent = "";
    
    (function walk(node) {
      
      if (Array.isArray(node)) {
        node.forEach(function(n) {
          if (statementIsMultiLine(n)) {
            walk(n); // multi-line statements 
          } else {
            
          }
          
          
          
          
          buffer += indent;
          walk(n);
          buffer += "\n";
        });
      } else {
        switch (node.type) {
          case A.DEF:
            buffer += 'def (';
            buffer += node.parameters.join(', ');
            buffer += ") {\n";
            indent++;
            walk(node.body);
            indent--;
          case A.IF:
            buffer += 'if ';
          case A.WHILE:
            buffer += 'while ';
            walk();
            buffer += " {\n";
            indent += INDENT;
            walk(node.body);
            indent--;
            buffer += "}\n";
          case A.LOOP:
          case A.RETURN:
            buffer += 'return ';
            walk();
            break;
          case A.ASSIGN:
          case A.CALL:
            walk(node.fn);
            
          case A.BIN_OP:
            walk(node.left);
            walk(node.right);
            break;
          case A.UN_OP:
          case A.YIELD:
            buffer += 'yield';
            break;
          case A.TRACE:
            buffer += 'trace';
            break;
          case A.IDENT:
            buffer += node.name;
            break;
          default:
            buffer += toSource(node);
            break;
        }
      }
      
    })(ast);
    
    return buffer
    
  }
  
})(simple, this);