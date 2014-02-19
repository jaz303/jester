# TODO

## Parser

  * <del>Imports/exports</del>
  * <del>Blocks</del>
  * <del>foreach</del>
  * <del>while</del>
  * <del>loop</del>
  * <del>if</del>
  * <del>return</del>
  * <del>spawn</del>
  * <del>trace</del>
  * <del>lambda</del>
  * <del>binary expressions</del>
  * <del>unary expressions</del>
  * <del>function definitions</del>
  * <del>boolean literals</del>
  * <del>integer literals</del>
  * <del>hex literals</del>
  * <del>binary literals</del>
  * <del>float literals</del>
  * <del>string literals</del>
  * <del>ident</del>
  * <del>global ident</del>
  * <del>color literal</del>
  * <del>color ctor</del>
  * <del>global object</del>
  * <del>function call</del>
  * function call - no paren
  * <del>property lookup</del>
  * <del>array access</del>
  * <del>yield</del>
  * <del>eval</del>
  * <del>partial application</del>
  * <del>array literals</del>
  * <del>dictionary literals</del>

## Bugs

  * Newlines in multi-line string tokens are not processed by lexer
  * If definition of blocking native function change while it is paused, new version will be invoked upon resume
  * Function constant pools use === for equality - results in duplicates of any values whose internal representations are objects e.g. colors

## Language Features

  * Fix/finalise scoping rules
  * REPL
  * Control flow - break/continue
  * Name mangling
  * Arrays
  * Dictionaries
  * <del>Spawn</del>
  * "Garbage collection"
  * stdlib

## Debugging tools (browser-based)

  * Inspector (function browser, bytecode explorer/decoder)
  * REPL
  * Timeline
  * Callstack visualiser
  * Breakpoints
  * Interaction with live stack-frame

## Internals/optimisations

  * Compiler flag - auto-yield insertion
  * Compiler flag - name mangling
  * Constant folding - see http://bugs.python.org/issue1346238
  * Dead code removal
  * Inline method cache
  * (possible) Implicit return is possible through syntax tree analysis and planting returns in the correct places. This would remove the need for 2 opcodes and save one
memory write per statement. Probably best leave this until we've got some
machinery in place for walking/transforming the AST.

## Tooling

  * Editor integration

## Future Roadmap

  * Closures
  * List comprehensions
  * Object system, maybe
