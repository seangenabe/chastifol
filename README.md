# Chastifol

Spawns commands in child processes in parallel and reechoes their output.

[![npm](https://img.shields.io/npm/v/chastifol.svg?style=flat-square)](https://www.npmjs.com/package/chastifol)
[![Travis Build Status](https://img.shields.io/travis/seangenabe/chastifol/master.svg?label=travis&style=flat-square)](https://travis-ci.org/seangenabe/chastifol)
[![AppVeyor Build Status](https://img.shields.io/appveyor/ci/seangenabe/chastifol/master.svg?label=appveyor&style=flat-square)](https://ci.appveyor.com/project/seangenabe/chastifol)
[![Dependency Status](https://img.shields.io/david/seangenabe/chastifol.svg?style=flat-square)](https://david-dm.org/seangenabe/chastifol)
[![devDependency Status](https://img.shields.io/david/dev/seangenabe/chastifol.svg?style=flat-square)](https://david-dm.org/seangenabe/chastifol#info=devDependencies)
[![node](https://img.shields.io/node/v/chastifol.svg?style=flat-square)](https://nodejs.org/en/download/)

## Rationale

This is an alternative to the bash operator `&`, which isn't exactly cross-platform (doesn't mean the same in Windows cmd).

## Command-line usage

```bash
chastifol <commandDef1>[ <commandDef2>][...]
```

where commandDefN can be one of (see the Arguments section below):

* `command`
* `"command arg1 \"arg2 with space\" ..."`
* `[ command arg1 "arg2 with space" ... ]`

The standard output and error streams of each command will be redirected to the same streams of the host process, with colored and indexed indicators from which command it originated from.

Exits with the first non-zero exit code if found.

### Arguments

Command arguments can either be literal string arguments or be surrounded by square brackets (or a combination of both!).

Argument handling is done by [subarg][subarg].

* When a command argument is a literal string,
  * Simple words such as `exit`, `echo`, `rm`, `mkdirp` are ok to be as-is.
  * More complicated combinations such as those containing slashes, backslashes, or spaces might need to be wrapped depending on your operating system.
    * Windows arguments should be wrapped with double-quotation marks `"`.
    * Other operating systems use single-quotation marks `'` instead.
  * Library writers and others concerned: for a cross-platform solution, do not use this option (due to the differences in quoting).
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

### Override colors

Force color output by using `--colors` or `--no-colors`. Enabled by [supports-color](https://github.com/chalk/supports-color). This may be useful for example if you have nested `chastifol` instances, in which case you'd want to specify `--colors` on the nested instance.

## API

```javascript
const Chastifol = require('chastifol')
```

### callable class Chastifol

`Chastifol` is a callable class, which means you can either call it directly as a function or instantiate instances of the class with `new`.

#### Chastifol(commands, opts = {})

Will create a new instance of `Chastifol` with the specified parameters, calls `start` on it, and returns that instance.

Parameters: Described below.
Returns: `Chastifol` - A `Chastifol` instance.

#### #constructor(commands, opts = {})

Creates a new instance of `Chastifol`.

Parameters:
* `commands: Iterable<String>`: an array of commands to run, with space-separated arguments.
* `opts: Object`: optional options object
  * `io: Array`: Optional. Stream selectors for each of the standard streams `[in, out, err]`.
  * `in, out, err: Stream|Function|Array` - shortcuts to set the corresponding elements in `io`.
  * `color: Boolean|Boolean[]` - Optional. When set, buffers the output by line, and color-codes each. Indexed by command if an array.

### #start(): undefined

Starts the commands. After synchronous execution, `#childProcesses` and `#exitAll` will be set.

#### #childProcesses: ChildProcess[]

The `ChildProcess` objects that were created.

### #exitCodes: Number[]

Exit codes from each process. Initialized to `[]` then filled by child processes as they exit.

### #exitAll: Promise<Number[]>

A promise that will be resolved when all child processes exit, with `#exitCodes` as the value.

**Stream selectors**

The standard streams of each child process can be redirected to a stream you specify. The stream can be specified as follows:

* `Function`: Will be called with the parameters:
  * `commandIndex`: The index of the command you passed.
  * `commandText`: The text of the command you passed.
  The function's return value will be used instead and will follow the rules after this one.
* `Array`: The array will be indexed by the command index and will follow the rules after this one.
* `null` or `undefined`: Do not assign a stream. This is the default.
* A stream: pipes the standard stream to/from it. Output streams should be assigned `Writable` streams and the input stream should be assigned `Readable` ones.
* The literal string `pipe`: Pipes the stream to/from the process running the code.

## Install

```bash
npm install chastifol
```

Install the module locally if you plan to use the API or run it in your npm scripts.

```bash
npm install -g chastifol
```

Install the module globally. Can be used as a CLI tool anywhere.

## Migrating from version 2 and below

Version 2 used node-style callbacks in combination with node-style synchronous return values, a la `http.request`. That means in addition to accepting a callback to the main gist of what you needed, you also get the object that processes it as the return value. In v2 we returned `ChildProcess[]` and called back with `Number[]`. In version 3 we now use a class. The object created from the class will be returned when you call the main callable class, or you can create the object yourself. In the function version, we'll return the object created. To get the exit codes, you'll want to access `.exitAll`, or `.exitCodes` for a live version. To get the child processes, you'll want to access `.childProcesses`.

## Similar packages

* [parallelshell](https://www.npmjs.com/package/parallelshell)
* [pm2](https://www.npmjs.com/package/pm2)

## License

MIT

[subarg]: https://www.npmjs.com/package/subarg
[browserify]: https://www.npmjs.com/package/browserify
[child_process]: https://nodejs.org/api/child_process.html
[child_process.exec]: https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback
