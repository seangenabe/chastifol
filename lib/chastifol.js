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

    let processRuns = this.runProcesses()
    this.exitAll = processRuns
      .then(() => {
        if (log.enabled) {
          let exitCodesString = Util.inspect(this.exitCodes, { colors: true })
          log(`resolving with exitCodes = ${exitCodesString}`)
        }
        return this.exitCodes
      })
  },

  runProcesses() {
    let { commandsLength } = this
    let processRuns = []
    let proxyMap = new Map()

    function createOutputStreamProxy(stream) {
      let proxy = proxyMap.get(stream)
      if (!proxy) {
        proxy = new Sink()
        proxy.pipe(stream)
        proxyMap.set(stream, proxy)
      }
      return proxy
    }

    for (let commandIndex = 0; commandIndex < commandsLength; commandIndex++) {
      let command = this.commands[commandIndex]
      log(`executing command: ${command}`)
      let cp = ChildProcess.spawn(command, [], { shell: true })
      this.childProcesses[commandIndex] = cp

      let colorCurrent = Boolean(this.color[commandIndex])
      let commandChalk = colorCurrent
        ? chalk[colors[commandIndex % colorsLength]]
        : null

      let proxies = []
      let cpExited = new Promise((resolve, reject) => {
        cp.on('error', reject)
        cp.on('exit', (code, signal) => resolve({ code, signal }))
      })

      // Pipe to output streams.
      for (let fd of [0, 1, 2]) {
        let inputStream
        let outputStream
        let currentIO = this.io[fd]
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
          currentIO = processStdio[fd]
        }
        if (fd === 0) {
          inputStream = currentIO
          outputStream = cp.stdio[fd]
        }
        else {
          inputStream = cp.stdio[fd]
          outputStream = currentIO
        }
        outputStream = createOutputStreamProxy(outputStream)
        proxies.push(outputStream)
        if (fd !== 0 && commandChalk) {
          // Color each line.
          let head = commandChalk(`${commandIndex} ${stdStreamName[fd]}>`)
          outputStream.addReadable(
            inputStream
              .pipe(split())
              .pipe(new Prepender({ prepend: head }))
          )
          outputStream.beforeEnd.push(() =>
            cpExited.then(({ code, signal }) => {
              let outputStr = code == null ? signal : code
              outputStream.write(
                `${commandChalk(`${commandIndex} end`)} ${outputStr}\n`
              )
            })
          )
        }
        else {
          // Pipe directly to stream.
          outputStream.addReadable(inputStream)
        }
      }

      processRuns.push(cpExited.then(({ code }) => {
        log(`process ${commandIndex} exited with code ${code}`)
        this.exitCodes[commandIndex] = code
      }))
    }

    for (let stream of proxyMap.values()) {
      stream.finalize()
    }

    return Promise.all(processRuns)
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
