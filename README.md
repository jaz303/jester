# jester

The idea is to create beginner-friendly, forgiving language with solid theoretical underpinnings. So you could start with a simple program like this:

    import! canvas

    pen #red
    moveto 10, 10
    lineto 30, 30
    lineto 10, 30
    lineto 10, 10

And progress to this:

    import! fun
    
    doubler = map .{ _ * 2 }, ?
    summer = reduce .{ l,r| l + r }, 0, ?

    sum_of_doubles = summer . doubler

    print sum_of_doubles([1,2,3,4,5])

Jester supports concurrency:
    
    def get(url) {
        -- perform HTTP GET of url
        -- return string
    }

    t1 = spawn get "http://google.com"
    t2 = spawn get "http://yahoo.com"
    t3 = spawn get "http://cuil.com"

    google = wait t1
    yahoo = wait t2
    cuil = wait t3

The initial implementation is a register-based virtual machine running in Javascript. Bypassing the JS call-stack in the interpreter allows us to implement Go-style async concurrency written in a blocking style, but without crazy syntax tree transformations that you see in compile-to-JS languages.

I've outlined the eventual syntax below, very little of this is implemented yet.

## TODO

  * document import/export syntax

## Notes

Stuff I might add

  * generic `for` loop - necessary?
  * object system - any point?
  * comprehension syntax
  * pattern matching
  * switch/case
  * do we need null/undefined/nil/none etc?
  * multiple return values/assignment
  * splat operator
  * kwargs
  * matrices?
  * rational numbers?
  * channels

There's a bit of punctuation still available for future work:

  `@`, `:`, `{`..`}` delimited blocks

UTF-8 equivalents will be supported as appropriate.

## Syntax Overview

### Comments

    -- this is a comment

### Literals

    5
    5_000_000
    1.23
    0b1100
    0xff33
    true
    false
    "string"
    #ff0000 -- RGB color
    #ff00007f -- RGBA color
    #red -- named color

### Variable assignment

    a = 10
    foo = "hello jello"

### Operator list

#### Unary

    !a
    ~a

#### Binary

    a + b
    a - b
    a * b
    a / b
    a ** b
    a << b
    a >> b
    a % b
    a & b
    a | b
    a ^ b
    a < b
    a <= b
    a == b
    a > b
    a >= b
    a . b

### Arrays

Literal

    []
    [1, 2, 3]

Access
    
    a = [1, 2, 3]
    a[0]
    a[1] = 100

### Dictionaries

Literal

    { foo = 10, bar = 20 }

Access

    a = { k1 = 10, k2 = 20 }
    
    a.k1
    a["key1"]

    a.k1 = 30
    a["key2"] = 40

### Vectors

2D and 3D vector literals are supported:

    origin2d = <0,0>
    origin3d = <0,0,0>

Supported operators for vectors: `*`, `/`, `+`, `-`, `.`.

### Function Definition

No arguments:

    def foo {
        
    }

With arguments:

    def foo(a, b, c) {

    }

With optional arguments:

    def foo(a, b = 10, c = 20) {

    }

As in Ruby, method names may end in `?` or `!`:

    def available? {
        false
    }

    def create_instance! {
        -- do mojo
    }

Functions defined with `def` are immutable and preclude any other assignment to that simple in the same scope.

Return is implicit but explicit returns are also allowed:

    def foo {
        10
    }

    def bar {
        return 20
    }

### Calling functions

    foo(a, b, c)

Parens are optional:

    foo a, b, c

Lone identifier is a function invocation iff ident bound to function (this may require a runtime check):

    foo

### Colors

Constructors:

    #(r, g, b)
    #(r, g, b, a)
    #("string")

### Control constructs

While:

    while exp {

    }

A loop is like `while` but there's an implicit `yield` at the end of the loop body:

    loop while exp {

    }

Convenient shorthand for `loop while true`:

    loop {

    }

If/else:

    if exp {

    } else if exp {

    } else {

    }

Iterate over array/dictionary values:

    foreach (ix in subject) {

    }

Iterate over array/dictionary keys/values:

    foreach (key, ix in subject) {

    }

### Globals

`$` is a globally accessible dictionary.

    $.foo = 10
    print $.foo

Dynamic lookups work of course:

    a = "foo"
    print $["foo"]

A shorthand syntax is also available:

    $foo
    print $foo

### Concurrency

Spawn invocation of function `foo` in a new green thread:
    
    task = spawn foo(a, b, c)

Wait for task to complete:

    wait task

Yield to the scheduler:

    yield

### Debugging

Call the trace function, if defined:

    trace

(`trace` always evaluates to true)

### Lambda syntax

Anonymous functions are created thusly:

    doubler = .{ x| x * 2 }

In instances where there is only a single parameter, `_` is implied:

    doubler = .{ _ * 2 }

### Partial Application

Functions may be partially applied; `?` denotes placeholder:

    doubler = map .{ s | s * 2 }, ?
    print doubler([1,2,3])
    -- => [2,4,6]

### Function composition

Functions may also be composed:

    f = .{ _ * 2 }
    g = .{ _ + 5 }
    
    -- whitespace is significant here; f.g would be a property lookup
    f_of_g = f . g
    print f_of_g(10)
    -- => 30
