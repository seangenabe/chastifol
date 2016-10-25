const ChildProcess = require('child_process')
const t = require('ava')
const Path = require('path')

const testdir = __dirname
const rootdir = Path.resolve(__dirname, '..')
const binfile = Path.resolve(rootdir, 'bin/chastifol')

let test1command
let platform = process.platform
let JSEOL = `
`
if (platform === 'win32') {
  // On Windows, escape commands using `"`. Escape quotes using `\"`
  test1command = `
node
${binfile}
[ node ${testdir}/recho c ]
[ node ${testdir}/recho "d with space" ]
"node ${testdir}/recho \\"e with space\\""
"node ${testdir}/recho \\"f\\with backslashes\\""`.trim().split(JSEOL).join(' ')
}
else {
  // Escape commands using `'`. Escape quotes using `\'`
  test1command = `
node ${binfile}
[ node ${testdir}/recho c ]
[ node ${testdir}/recho 'd with space' ]
'node ${testdir}/recho '\\''e with space'\\'' '"
'node ${testdir}/recho '\\''f\\with backslashes'\\'' '`.trim().split(JSEOL).join(' ')
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

function includesElements(parentArray, queryArray) {
  return queryArray.every(q => {
    return parentArray.includes(q)
  })
}

t(`should run the scripts without error (${platform})`, async t => {
  let stdout = await exec(test1command)
  // can be out of order
  t.true(includesElements(stdout.toString().trim().split('\n'), [
    '0 out>c',
    '1 out>d with space',
    '2 out>e with space',
    '3 out>f\\with backslashes'
  ]))
})

t('should run the scripts with error', async t => {
  let err = await t.throws(
    exec(`node ${binfile} [ exit 0 ] [ exit 7 ] [ exit 8 ]`)
  )
  t.is(err.code, 7)
})

t('should work via the bin script', async t => {
  let stdout = await exec('chastifol [ echo a ] "echo b"')
  let result = stdout.toString().trim().split('\n')
  t.true(includesElements(result, ['0 out>a', '1 out>b']))
})
