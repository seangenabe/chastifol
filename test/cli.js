
var ChildProcess = require('child_process')
var FS = require('fs')
var assert = require('assert')

describe('CLI', function() {

  this.timeout(5000)

  function clean() {
    try { FS.unlinkSync('test/c.txt') } catch (err) {}
    try { FS.unlinkSync('test/d.txt') } catch (err) {}
  }

  before(clean)

  it('should run the scripts without error', function(cb) {
    ChildProcess.exec('chastifol' +
      ' [ node test/write-file c.txt ]' +
      ' [ node test/write-file d.txt ]', function(error, stdout, stderr) {
        try {
          if (error) throw error
          assert.strictEqual(FS.readFileSync('test/c.txt', {encoding: 'utf8'}), 'foo')
          assert.strictEqual(FS.readFileSync('test/d.txt', {encoding: 'utf8'}),'foo')
          cb()
        }
        catch (err) {
          cb(err)
        }
      })
  })

  it('should run the scripts with error', function(cb) {
    ChildProcess.exec('chastifol' +
      ' [ exit 0 ]' +
      ' [ exit 7 ]', function(err1, stdout, stderr) {
        try {
          assert(err1 != null)
          assert(err1.code === 7, 'non-seven exit code: ' + err1.code)
          cb()
        }
        catch (err2) {
          cb(err2)
        }
      }
    )
  })

})
