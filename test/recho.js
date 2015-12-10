'use strict'

// joins arguments with #

setTimeout(() => {
  let argsString = process.argv.slice(2).join('#')
  process.stdout.write(`${argsString}\n`)
}, 500)
