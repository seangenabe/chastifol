# Chastifol

Execs commands in child processes and reechoes their output.

[![npm](https://img.shields.io/npm/v/chastifol.svg?style=flat-square)](https://www.npmjs.com/package/chastifol)
[![Build Status](https://img.shields.io/travis/seangenabe/chastifol/master.svg?style=flat-square)](https://travis-ci.org/seangenabe/chastifol)
[![Dependency Status](https://img.shields.io/david/seangenabe/chastifol.svg?style=flat-square)](https://david-dm.org/seangenabe/chastifol)
[![devDependency Status](https://img.shields.io/david/dev/seangenabe/chastifol.svg?style=flat-square)](https://david-dm.org/seangenabe/chastifol#info=devDependencies)

## Command-line usage

    chastifol [ command1 arg1 ... argn ] [ command2 arg1 ... argn" ] ...

[Exec][child_process.exec]s commands and reechoes their output.

The standard output and error streams of each command will be redirected to the same streams of this process,
with colored and indexed indicators from which command it originated from.

Exits with the first non-zero exit code if found.

Argument handling is done by [subarg](https://www.npmjs.com/package/subarg).

[child_process.exec]: https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback

**Example**

For example, the following command:

```bash
    $ chastifol [ echo Hello ] [ echo World ]
    0 out>Hello
    0 out>
    0 out>
    1 out>World
    1 out>
    1 out>
```

**Example scenario**

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
  * `out` - `Writable|Function|Array` - Optional. Output stream selector for standard output stream, see below. Default: `undefined`.
  * `err` - `Writable|Function|Array` - Optional. Output stream selector for standard error stream, see below. Default: `undefined`.
  * `color` - `bool|bool[]` - Optional. When set, buffers the output by line, and color-codes each by process. A value can be specified for each process by passing an array. Defaults to false.
* `next` - `Function(Error, Number[])` - Called when all child processes terminate.

**Returns**

`ChildProcess[]` - An array of `ChildProcess` instances corresponding to each command

**Errors**

`chastifol()` will throw some errors if it didn't like some of your input.
It will throw only when it's called, so watch out for that.
If it does throw, it will never get to call the `next` callback.

**Stream selectors**

Either or both the standard output stream or the standard error stream of each child process can be redirected to a stream you specify. The stream can be specified as follows:

* Pass `null` or `undefined` to not assign an output stream.
* Pass a `Writable` stream to assign as the output stream.
* Pass a `function(commandIndex, commandText)` and it will be called with:
  * `commandIndex` - The index of the command you passed.
  * `commandText` - The text of the command you passed.
  The function should return a `Writable` stream. The child process stream will
  be directly piped into that stream.
* Pass an `Array` and it will be indexed by the command index.
  Each indexed element should either be a `Writable` or a `Function` and will follow the above rules.

If an array is not passed, all corresponding streams will be redirected to the specified `Writable` or `Function`.

## Install

`npm install chastifol`

Install the module locally if you plan to use the API or run it in your npm scripts.

`npm install -g chastifol`

Install the module globally. Can be used as a CLI tool anywhere.

## License

MIT
