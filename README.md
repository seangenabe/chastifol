# Chastifol

Execs commands in child processes and reechoes their output.

[![Build Status](https://travis-ci.org/seangenabe/chastifol.svg?branch=master)](https://travis-ci.org/seangenabe/chastifol)
[![Dependency Status](https://david-dm.org/seangenabe/chastifol.svg)](https://david-dm.org/seangenabe/chastifol)

## Command-line usage

    chastifol "command1 arg1 ... argn" "command2 arg1 ... argn" ...

[Exec](https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback)s commands and reechoes their output.

The standard output and error streams of each command will be redirected to the same streams of this process,
with colored and indexed indicators from which command it originated from.

Exits with the first non-zero exit code if found.

**Example usage**

    chastifol "node server.js" "npm run watch" "livereload app"
    
Tip: When using npm, if you have a complicated command that has quotes, etc., it might be a good idea to separate it into another script. Then write:

    chastifol "npm run task1" "npm run task2" ...

## API

    var chastifol = require('chastifol')

### `chastifol(commands, [opts], next)`

[Exec](https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback)s commands and reechoes their output.

**Arguments**

* `commands` - `string[]` - an array of commands to run, with space-separated arguments
* `opts` - `Object`
  * `out` - `Writable|Function|Array` - Standard output stream selector, see below
  * `err` - `Writable|Function|Array` - Standard error stream selector, see below
* `next` - `Function(Error, Number[])` - Called when all child processes terminate

**Returns**

`ChildProcess[]` - An array of child processes corresponding to each command

**Stream selectors**

Pass a `Writable` stream to enable colored line-by-line buffered output.

Pass a `function(commandIndex, commandText)` and it will be called with:

* `commandIndex` - The index of the command you passed.
* `commandText` - The text of the command you passed.

The function should return a `Writable` stream. The child process stream will
be directly piped into that stream.

Pass an `Array` and it will be indexed by the command index.
The indexed element should either be a `Writable` or a `Function` and will follow the above rules.
If an array is not passed, the `Writable` or the `Function` will be applied to all corresponding streams.

## Install

`npm install chastifol`

Install the module locally if you plan to use the API or run it in your npm scripts.

`npm install -g chastifol`

Install the module globally. Can be used as a CLI tool anywhere.

## License

MIT
