const ChildProcess = require('child_process')
const chalk = require('chalk')
const Util = require('util')
const log = require('debug')('chastifol')
const split = require('split')
const Sink = require('./sink')
const Prepender = require('./prepender')

let processStdio = [
  process.stdin,
  process.stdout,
  process.stderr
]

const noop = function() {}
const colors = ['blue', 'yellow', 'red', 'cyan', 'green', 'magenta']
const colorsLength = colors.length
const stdStreamName = ['in', 'out', 'err']

function Chastifol(commands, opts) {
  if (!(this instanceof Chastifol)) {
    let c = new Chastifol(commands, opts)
    c.start()
    return c
  }
  commands = Array.from(commands)
  this.commands = commands
  this.commandsLength = commands.length
  this.opts = opts || {}
  this.childProcesses = []
  this.exitCodes = []
  this.outputStreamProxies = new Map()
}

Object.assign(Chastifol.prototype, {

  start() {
    let commandsLength = this.commandsLength
    let opts = this.opts
    if (log.enabled) {
      let commandsString = Util.inspect(this.commands, { colors: true })
      log(`start called with commands ${commandsString}`)
    }

    // Extract opts
    let io = this.io = opts.io || []
    io[0] = io[0] || opts.in
    io[1] = io[1] || opts.out
    io[2] = io[2] || opts.err
    let color = opts.color
    if (color == null) { color = false }
    if (typeof color === 'boolean') {
      color = new Array(this.commandsLength).fill(color)
    }
    else if (!Array.isArray(color)){
      throw new TypeError("opts.color must be an array.")
    }
    this.color = color
    this.colorEnabled = Boolean(opts.color)

    let processRuns = []
    for (let i = 0; i < commandsLength; i++) {
      processRuns.push(this.runProcess(i))
    }
    this.exitAll = Promise.all(processRuns)
      .then(() => {
        if (log.enabled) {
          let exitCodesString = Util.inspect(this.exitCodes, { colors: true })
          log(`resolving with exitCodes = ${exitCodesString}`)
        }
        return this.exitCodes
      })
  },

  // creates or gets an output stream Sink proxy
  createOutputStreamProxy(stream) {
    let proxy = this.outputStreamProxies.get(stream)
    if (!proxy) {
      proxy = new Sink()
      proxy.pipe(stream)
      this.outputStreamProxies.set(stream, proxy)
    }
    return proxy
  },

  runProcess(commandIndex) {
    let command = this.commands[commandIndex]
    log(`executing command: ${command}`)
    let cp = ChildProcess.spawn(command, [], { shell: true }, noop)
    this.childProcesses[commandIndex] = cp

    let colorCurrent = Boolean(this.color[commandIndex])
    let commandChalk = colorCurrent
      ? chalk[colors[commandIndex % colorsLength]]
      : null

    // Pipe to output streams.
    for (let ioIndex of [0, 1, 2]) {
      let inputStream
      let outputStream
      let currentIO = this.io[ioIndex]
      if (typeof currentIO === 'function') {
        // Invoke function.
        currentIO = currentIO(commandIndex, command)
      }
      if (Array.isArray(currentIO)) {
        // Index array by command index.
        currentIO = currentIO[commandIndex]
      }
      if (currentIO == null) { continue }
      if (currentIO === 'pipe') {
        // Create a pipe between this process and child process.
        currentIO = processStdio[ioIndex]
      }
      if (ioIndex === 0) {
        inputStream = currentIO
        outputStream = cp.stdio[ioIndex]
      }
      else {
        inputStream = cp.stdio[ioIndex]
        outputStream = currentIO
      }
      outputStream = this.createOutputStreamProxy(outputStream)
      if (ioIndex !== 0 && commandChalk) {
        // Color each line.
        let head = commandChalk(`${commandIndex} ${stdStreamName[ioIndex]}>`)
        outputStream.addReadable(
          inputStream
            .pipe(split())
            .pipe(new Prepender({ prepend: head }))
        )
      }
      else {
        // Pipe directly to stream.
        outputStream.addReadable(inputStream)
      }
    }

    return new Promise((resolve, reject) => {
      cp.on('exit', (code, signal) => {
        log(`process ${commandIndex} exited with code ${code}`)
        this.exitCodes[commandIndex] = code
        resolve()
      })
      cp.on('error', reject)
    })
  }

}) // Chastifol.prototype

function getCommands() {
  let argv = process.argv.slice(2)
  const subarg = require('subarg')
  const flatten = require('unparse-args')
  const _join = require('command-join')
  const join = arg => _join(arg.map(x => String(x)))
  log(`argv = ${Util.inspect(argv, { colors: true })}`)

  let args = subarg(argv)._
  log(`args after subarg = ${Util.inspect(args, { colors: true })}`)
  let ret = []
  for (let i = 0, len = args.length; i < len; i++) {
    let command = args[i]
    log(`command_${i} = ${Util.inspect(command, { colors: true })}`)
    if (typeof command === 'string') {
      // literal command string
      ret.push(command)
    }
    else if (typeof command === 'object') {
      // subarg/minimatch object
      let escaped = join(flatten(command))
      log(`escaped = ${escaped}`)
      ret.push(escaped)
    }
  }

  return ret
}

Chastifol.cli = function() {
  let c = Chastifol(getCommands(), {
    out: process.stdout,
    err: process.stderr,
    color: true
  })
  c.exitAll.then(
    exitCodes => {
      for (let exitCode of exitCodes) {
        if (exitCode !== 0) {
          process.exit(exitCode)
        }
      }
    },
    err => {
      console.log(Util.inspect(err, { colors: true }))
      process.exit(1)
    }
  )
}

if (require.main === module) {
  Chastifol.cli()
}

module.exports = Chastifol
