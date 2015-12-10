'use strict'

const ChildProcess = require('child_process')
const expect = require('chai').expect

describe('CLI', function() {

  this.timeout(5000)

  let test1command
  let platform = process.platform
  if (platform === 'win32') {
    // On Windows, escape commands using `"`. Escape quotes using `\"`
    test1command = 'node .' +
      ' [ node test/recho c ]' +
      ' [ node test/recho "d with space" ]' +
      ' "node test/recho \\"e with space\\""' +
      ' "node test/recho \\"f\\with backslashes\\""'
  }
  else {
    // Escape commands using `'`. Escape quotes using `\'`
    test1command = 'node .' +
      ' [ node test/recho c ]' +
      " [ node test/recho 'd with space' ]" +
      " 'node test/recho '\\''e with space'\\'' '" +
      " 'node test/recho '\\''f\\with backslashes'\\'' '"
  }

  function exec(command) {
    return new Promise((resolve, reject) => {
      ChildProcess.exec(command, (err, stdout) => {
        if (err) {
          reject(err)
          return
        }
        resolve(stdout)
      })
    })
  }

  it(`should run the scripts without error (${platform})`, async function() {
    let stdout = await exec(test1command)
    // can be out of order
    expect(stdout.toString().trim().split('\n')).to.include.members([
      '0 out>c',
      '1 out>d with space',
      '2 out>e with space',
      '3 out>f\\with backslashes'
    ])
  })

  it('should run the scripts with error', async function() {
    try {
      await exec('node . [ exit 0 ] [ exit 7 ] [ exit 8 ]')
      expect.fail()
    }
    catch (err) {
      expect(err).to.be.an.instanceof(Error)
      // should pick up the first non-zero exit code
      // err.code is from child_process.exec
      expect(err.code).to.equal(7)
    }
  })

  it('should work via the bin script', async function() {
    let stdout = await exec('chastifol [ echo a ] "echo b"')
    expect(stdout.toString().trim().split('\n')).to.include.members([
      '0 out>a',
      '1 out>b'
    ])
  })

})
