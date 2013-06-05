;(function(global, simple) {
  
  const BIT_WIDTH = 2.8125;
  
  global.disassemble = function(fn) {
    
    var wrapper = document.createElement('div');
    wrapper.className = 'function-inspector';
    
    var title = document.createElement('h3');
    title.className = 'r-title';
    title.innerText = fn.name;
    
    var meta = document.createElement('div');
    meta.className = 'r-meta';
    meta.innerHTML = 'args: ' + fn.minArgs + '..' + fn.maxArgs;
    
    var locals = document.createElement('ol');
    locals.className = 'r-locals';
    
    locals.start = '0';
    for (var i = 0; i < fn.locals.length; ++i) {
      var li = document.createElement('li');
      li.innerText = fn.locals[i];
      locals.appendChild(li);
    }
    
    var code = document.createElement('ul');
    code.className = 'r-code';
    
    for (var i = 0; i < fn.code.length; ++i) {
      var op = fn.code[i];
      
      var opEl = document.createElement('li');
      
      var offset = document.createElement('span');
      offset.className = 'r-offset';
      offset.style.width = '10%';
      offset.innerText = i;
      opEl.appendChild(offset);
      
      var opcode = document.createElement('span');
      opcode.className = 'r-opcode';
      opcode.style.width = (8 * BIT_WIDTH) + '%';
      opcode.innerText = simple.opcodeMeta[op & 0xFF].name;
      opEl.appendChild(opcode);
      
      var remainingBits = 24,
          operands      = simple.opcodeMeta[op & 0xFF].operands;
      
      for (var j = 0; j < operands.length; j += 3) {
        var nbits = (operands[j] - operands[j+1]) + 1,
            operand = (op >> operands[j+1]) & (Math.pow(2, nbits) - 1),
            operandEl = document.createElement('span');
            
        operandEl.className = 'r-operand r-operand-' + operands[j+2];
        operandEl.style.width = (BIT_WIDTH * nbits) + '%';
        
        var text;
        switch (operands[j+2]) {
          case 'constant':
            text = '' + fn.constants[operand];
            break;
          case 'local':
            text = fn.locals[operand];
            break;
          case 'roffset':
            text = '#' + (operand > 0 ? '+' : '-') + Math.abs(operand);
            break;
          case 'aoffset':
            text = '#' + operand;
            break;
         default:
            text = '' + operand;
        }
        
        operandEl.innerText = text;
        opEl.appendChild(operandEl);
        
        remainingBits -= nbits;
      }
      
      if (remainingBits > 0) {
        var spacer = document.createElement('span');
        spacer.className = 'r-operand r-unused';
        spacer.style.width = (remainingBits * BIT_WIDTH) + '%';
        spacer.innerHTML = '&nbsp;'
        opEl.appendChild(spacer);
      }
      
      code.appendChild(opEl);
      
    }
    
    wrapper.appendChild(title);
    wrapper.appendChild(meta);
    wrapper.appendChild(locals);
    wrapper.appendChild(code);
    return wrapper;
    
  };
  
})(this, simple);