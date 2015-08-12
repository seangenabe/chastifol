var ChildProcess = require('child_process')
var chalk = require('chalk')
var assert = require('assert')
var pipeToStream = require('./pipe-to-stream')
var fillArray = require('./fill-array')

function noop() {}

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
  var color = opts.color
  if (color == null) color = false
  if (typeof color === 'boolean') {
    color = fillArray(color, commandsLength)
  }
  else {
    assert(Array.isArray(color))
  }
  var colorEnabled = !!opts.color

  var colors = ['blue', 'green', 'cyan', 'yellow', 'red', 'magenta']
  var colorsLength = colors.length

  var childProcesses = []

  for (var commandIndex = 0; commandIndex < commandsLength; commandIndex++) {
    childProcesses.push((function(commandIndex) {

      var command = commands[commandIndex]
      var cp = ChildProcess.exec(command, {}, noop)
      var colorCurrent = !!color[commandIndex]
      var commandChalk = colorCurrent ? chalk[colors[commandIndex % colorsLength]] : null

      pipeToStream(cp.stdout, out, commandIndex, command, commandChalk, cp)
      pipeToStream(cp.stderr, err, commandIndex, command, commandChalk, cp)

      cp.on('exit', function(code, signal) {
        exitCodes[commandIndex] = code
        commandsExitedLength++
        if (commandsExitedLength == commandsLength) {
          next(null, exitCodes)
        }
      })

      return cp
    })(commandIndex))
  }

  return childProcesses
}

chastifol.cli = function() {
  chastifol(process.argv.slice(2), {
    out: process.stdout,
    err: process.stderr,
    color: true
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
