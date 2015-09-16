
var ChildProcess = require('child_process')
var FS = require('fs')
var assert = require('assert')

describe('CLI', function() {

  this.timeout(5000)

  function clean() {
    try { FS.unlinkSync('test/c.txt') } catch (err) {}
    try { FS.unlinkSync('test/d with space.txt') } catch (err) {}
    try { FS.unlinkSync('test/e with space.txt') } catch (err) {}
  }

  before(clean)
  after(clean)

  it('should run the scripts without error', function(cb) {
    var cp = ChildProcess.exec('node .' +
      ' [ node test/write-file c.txt ]' +
      ' [ node test/write-file "d with space.txt" ]' +
      ' "node test/write-file \\"e with space.txt\\"', function(error, stdout, stderr) {
        try {
          if (error) throw error
          assert.strictEqual(FS.readFileSync('test/c.txt', {encoding: 'utf8'}), 'foo')
          assert.strictEqual(FS.readFileSync('test/d with space.txt', {encoding: 'utf8'}),'foo')
          assert.strictEqual(FS.readFileSync('test/e with space.txt', {encoding: 'utf8'}), 'foo')
          cb()
        }
        catch (err) {
          cb(err)
        }
      })
    //cp.stdout.pipe(process.stdout)
    //cp.stderr.pipe(process.stderr)
  })

  it('should run the scripts with error', function(cb) {
    ChildProcess.exec('node .' +
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
