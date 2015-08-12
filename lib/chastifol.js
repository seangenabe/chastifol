var ChildProcess = require('child_process')
var OS = require('os')
var split = require('split')
var chalk = require('chalk')
var assert = require('assert')

function noop() {}

var EOL = OS.EOL

function pipeToStream(inputStream, outputStream, commandIndex, commandText, commandChalk) {
  if (outputStream == null) return
  if (Array.isArray(outputStream)) {
    outputStream = outputStream[commandIndex]
  }
  if (typeof outputStream === 'function') {
    // Invoke function.
    outputStream = outputStream(commandIndex, commandText)
    // Pipe directly to stream.
    inputStream.pipe(outputStream)
  }
  else {
    assert(typeof outputStream.write === 'function')
    inputStream.pipe(split())
    .on('data', function(line) {
      outputStream.write(commandChalk(commandIndex + ' out>') + line + EOL)
    })
  }
}

function chastifol(commands, opts, next) {
  assert(Array.isArray(commands))
  var commandsLength = commands.length

  // Quick exit on command length = 0
  if (!commands.length) {
    next(null, [])
    return []
  }

  var commandsExitedLength = 0
  var exitCodes = []

  // Optional opts argument
  if (opts && next === undefined) {
    next = opts
  }

  // Extract opts
  if (opts == null) {
    opts = {}
  }
  var out = opts.out
  var err = opts.err

  var colors = ['blue', 'green', 'cyan', 'yellow', 'red', 'magenta']
  var colorsLength = colors.length

  var childProcesses = []

  for (var commandIndex = 0; commandIndex < commandsLength; commandIndex++) {
    childProcesses.push((function(commandIndex) {

      var command = commands[commandIndex]
      var cp = ChildProcess.exec(command, {}, noop)
      var commandChalk = chalk[colors[commandIndex % colorsLength]]

      cp.on('exit', function(code, signal) {
        exitCodes[commandIndex] = code
        commandsExitedLength++
        if (commandsExitedLength == commandsLength) {
          next(null, exitCodes)
        }
      })

      pipeToStream(cp.stdout, out, commandIndex, command, commandChalk)
      pipeToStream(cp.stderr, err, commandIndex, command, commandChalk)

      return cp
    })(commandIndex))
  }

  return childProcesses
}

chastifol.cli = function() {
  chastifol(process.argv.slice(2), {
    out: process.stdout,
    err: process.stderr
  }, function(err, exitCodes) {
    if (err) {
      process.exit(1)
    }
    for (var i = 0, exitCodesLength = exitCodes.length; i < exitCodesLength; i++) {
      if (exitCodes[i] != 0) {
        process.exit(exitCodes[i])
      }
    }
  })
}

if (require.main === module) {
  chastifol.cli()
}

module.exports = chastifol
