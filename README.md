# Chastifol

[Exec][child_process.exec]s commands in child processes in parallel and reechoes their output.

[![npm](https://img.shields.io/npm/v/chastifol.svg?style=flat-square)](https://www.npmjs.com/package/chastifol)
[![Build Status](https://img.shields.io/travis/seangenabe/chastifol/master.svg?style=flat-square)](https://travis-ci.org/seangenabe/chastifol)
[![Dependency Status](https://img.shields.io/david/seangenabe/chastifol.svg?style=flat-square)](https://david-dm.org/seangenabe/chastifol)
[![devDependency Status](https://img.shields.io/david/dev/seangenabe/chastifol.svg?style=flat-square)](https://david-dm.org/seangenabe/chastifol#info=devDependencies)

## Command-line usage

```bash
chastifol <commandDef1>[ <commandDef2>][...]
```

where commandDefN can be one of (see the Arguments section below):

* `command`
* `"command arg1 \"arg2 with space\" ..."`
* `[ command arg1 "arg2 with space" ...]`

The standard output and error streams of each command will be redirected to the same streams of this process,
with colored and indexed indicators from which command it originated from.

Exits with the first non-zero exit code if found.

### Arguments

Command arguments can either be literal string arguments or be surrounded by square brackets (or a combination of both!).

Argument handling is done by [subarg][subarg].

* When a command argument is a literal string,
  * Simple words such as `exit`, `echo`, `rm`, `mkdirp` are ok to be as-is.
  * More complicated combinations such as those containing slashes, backslashes, or spaces might need to be wrapped depending on your operating system.
    * Windows arguments should be wrapped with double-quotation marks `"`.
    * Other operating systems use single-quotation marks `'` instead.
  * Library writers and others concerned: for a cross-platform solution, do not use this option.
* When a command argument is wrapped in square brackets ` [ ] `,
  * A new [subarg][subarg] context is created.
  * Brackets can be nested indefinitely, on commands that support subarg too (such as [browserify][browserify]).

**Sample run**

```bash
$ chastifol [ echo Hello ] [ echo World ]
0 out>Hello
0 out>
0 out>
1 out>World
1 out>
1 out>
```

(The extra newlines are from the shell interpreter—cmd/bash/etc.—and might differ among platforms.)

**Example scenario**

The following will run your server, watcher and livereload server all at the same time:

```bash
chastifol [ node server.js ] [ npm run watch ] [ livereload app ]
```

Tip: When using npm, if you have a complicated or long command that has special characters, etc., it might be a good idea to separate it into another script. Then write:

```bash
chastifol [ npm run task1 ] [ npm run task2 ] ...
```

## API

```javascript
var chastifol = require('chastifol')
```

### `chastifol(commands, [opts], [next])`

* `commands` - `string[]` - an array of commands to run, with space-separated arguments
* `opts` - `Object` - optional options object.
  * `out` - `Writable|Function|Array` - Optional. Output stream selector for standard output stream, see below. Default: `undefined`.
  * `err` - `Writable|Function|Array` - Optional. Output stream selector for standard error stream, see below. Default: `undefined`.
  * `color` - `bool|bool[]` - Optional. When set, buffers the output by line, and color-codes each by process. A value can be specified for each process by passing an array. Defaults to false.
* `next` - `Function(Error, Number[])` - Optional. Called when all child processes terminate.
* Return: `ChildProcess[]` - An array of `[ChildProcess][child_process]` instances corresponding to each command.

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

```bash
npm install chastifol
```

Install the module locally if you plan to use the API or run it in your npm scripts.

```bash
npm install -g chastifol
```

Install the module globally. Can be used as a CLI tool anywhere.

## License

MIT

[subarg]: https://www.npmjs.com/package/subarg
[browserify]: https://www.npmjs.com/package/browserify
[child_process]: https://nodejs.org/api/child_process.html
[child_process.exec]: https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback
