
var chastifol = require('./../lib/chastifol')
var assert = require('assert')

chastifol(["echo 1", "echo 2"], function(err, exitCode) {
  try {
    if (err) throw err
    assert(exitCode, 0)
  }
  catch (err2) {
    console.error(err2)
    process.exit(1)
  }
})
