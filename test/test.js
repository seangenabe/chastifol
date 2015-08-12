
var chastifol = require('./../lib/chastifol')
var assert = require('assert')
var Path = require('path')

chastifol(
  ["cat test/1.txt", "cat test/a.txt"],
  {
    color: true,
    out: process.stdout,
    err: process.stderr
  },
  function(err, exitCode) {
    try {
      if (err) throw err
      assert(exitCode, 0)
    }
    catch (err2) {
      console.error(err2)
      process.exit(1)
    }
  }
)
