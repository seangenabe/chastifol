
var ChildProcess = require('child_process')
var FS = require('fs')
var assert = require('assert')
var OS = require('os')

describe('CLI', function() {

  this.timeout(5000)

  function clean() {
    try { FS.unlinkSync('test/c.txt') } catch (err) {}
    try { FS.unlinkSync('test/d with space.txt') } catch (err) {}
    try { FS.unlinkSync('test/e with space.txt') } catch (err) {}
    try { FS.unlinkSync('test/f/f nested.txt') } catch (err) {}
  }

  before(clean)
  after(clean)

  var test1command
  var platform = OS.platform()
  if (platform === 'win32') {
    // On Windows, escape commands using `"`. Escape quotes using `\"`
    test1command = 'node .' +
      ' [ node test/write-file c.txt ]' +
      ' [ node test/write-file "d with space.txt" ]' +
      ' "node test/write-file \\"e with space.txt\\""' +
      ' "node test/write-file \\"f\\\\f nested.txt\\""'
  }
  else {
    // Escape commands using `'`. Escape quotes using `\'`
    test1command = 'node .' +
      ' [ node test/write-file c.txt ]' +
      " [ node test/write-file 'd with space.txt' ]" +
      " 'node test/write-file \\'e with space.txt\\''" +
      " 'node test/write-file \\'f/f nested.txt\\''"
  }

  it('should run the scripts without error (' + platform + ')', function(cb) {
    var cp = ChildProcess.exec(test1command, function(error, stdout, stderr) {
        try {
          if (error) throw error
          assert.strictEqual(FS.readFileSync('test/c.txt', {encoding: 'utf8'}), 'foo')
          assert.strictEqual(FS.readFileSync('test/d with space.txt', {encoding: 'utf8'}),'foo')
          assert.strictEqual(FS.readFileSync('test/e with space.txt', {encoding: 'utf8'}), 'foo')
          assert.strictEqual(FS.readFileSync('test/f/f nested.txt', {encoding: 'utf8'}), 'foo')
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
