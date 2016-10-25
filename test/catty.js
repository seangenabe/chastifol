'use strict' // eslint-disable-line strict

// wraps stdin with "meow" or the first argument.

const concat = require('concat-stream')

let wrap = process.argv[2] || 'meow'

let out = concat(buffer => {
  setTimeout(() => {
    let str = buffer.toString('utf8')
    process.stdout.write(`${wrap}${str}${wrap}\n`)
  }, 500)
})

process.stdin.pipe(out)
