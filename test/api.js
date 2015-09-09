
var chastifol = require('./../lib/chastifol')
var assert = require('assert')
var Path = require('path')
var FS = require('fs')

describe('API', function() {

  this.timeout(5000)

  function clean() {
    try { FS.unlinkSync('test/a.txt') } catch (err) {}
    try { FS.unlinkSync('test/b.txt') } catch (err) {}
  }

  before(clean)
  after(clean)

  it('should run the scripts without error', function(cb) {
    var cpArr = chastifol(
      [
        'node test/write-file a.txt',
        'node test/write-file b.txt'
      ],
      {
        out: process.stdout,
        err: process.stderr
      },
      function(err, exitCode) {
        try {
          if (err) throw err
          assert.strictEqual(FS.readFileSync('test/a.txt', {encoding: 'utf8'}), 'foo')
          assert.strictEqual(FS.readFileSync('test/b.txt', {encoding: 'utf8'}), 'foo')
          cb()
        }
        catch (err2) {
          cb(err2)
        }
      }
    )
    assert(Array.isArray(cpArr))
  })

  it('should run the scripts with error', function(cb) {
    chastifol(
      [
        'exit 0',
        'exit 5'
      ],
      function(err, exitCodes) {
        try {
          if (err) throw err
          assert(Array.isArray(exitCodes))
          assert.strictEqual(exitCodes[0], 0)
          assert.strictEqual(exitCodes[1], 5)
          cb()
        }
        catch (err2) {
          cb(err2)
        }
      }
    )
  })

})
