const Chastifol = require('./../lib/chastifol')
const _concat = require('concat-stream')
const t = require('ava')
const PassThrough = require('stream').PassThrough

const testdir = __dirname

function concat() {
  let stream
  let promise = new Promise(resolve => {
    stream = _concat({ encoding: 'buffer' }, resolve)
  })
  return { stream, promise }
}

t('should not run', async t => {
  let c = Chastifol([])
  t.true(c instanceof Chastifol)
  t.deepEqual(c.exitCodes, [])
  t.truthy(await c.exitAll)
})

t('should be able to be instantiated', async t => {
  let c = new Chastifol([])
  t.true(c instanceof Chastifol)
  t.deepEqual(c.exitCodes, [])
  t.is(c.exitAll, undefined)
  c.start()
  t.truthy(await c.exitAll)
})

t('should run the scripts without error', async t => {
  let out1 = concat()
  let out2 = concat()
  let c = Chastifol(
    [
      `node ${testdir}/recho a b c`,
      `node ${testdir}/recho "def egh" "i" "j\\k\\l"`
    ],
    {
      out: [out1.stream, out2.stream]
    }
  )
  t.true(Array.isArray(c.childProcesses))
  t.is(c.childProcesses.length, 2)
  let result = await c.exitAll
  t.deepEqual(result, [0, 0])

  let out1result = (await out1.promise).toString().trim()
  t.is(out1result, 'a#b#c')

  let out2result = (await out2.promise).toString().trim()
  t.is(out2result, 'def egh#i#j\\k\\l')
})

t('should run the scripts with nonzero exit code', async t => {
  let c = Chastifol(['exit 0', 'exit 5'])
  t.deepEqual(await c.exitAll, [0, 5])
})

t('should accept single out stream', async t => {
  let out = concat()
  let out1 = concat()
  let out2 = concat()
  let res = Chastifol(
    [`node ${testdir}/recho a`, `node ${testdir}/recho b`],
    { out: out.stream }
  )
  res.childProcesses[0].stdout.pipe(out1.stream)
  res.childProcesses[1].stdout.pipe(out2.stream)
  let resExitAll = await res.exitAll
  t.deepEqual(resExitAll, [0, 0])
  let outResult = await out.promise
  outResult = outResult.toString().trim().split('\n').filter(Boolean)
  t.deepEqual(new Set(outResult), new Set(['a', 'b']))
  let out1r = (await out1.promise).toString().trim()
  let out2r = (await out2.promise).toString().trim()
  t.is(out1r, 'a')
  t.is(out2r, 'b')
})

t('should be able to read from a single input stream', async t => {
  let stream = new PassThrough()
  let out = concat()
  let res =
    Chastifol(
      [`node ${testdir}/catty`, `node ${testdir}/catty woof`],
      { in: stream, out: out.stream }
    )
  setTimeout(() => stream.end('hello'), 4)
  let resExitAllResult = await res.exitAll
  let pResult = (await out.promise)
    .toString().trim().split('\n').filter(Boolean)

  t.deepEqual(new Set(pResult), new Set(['meowhellomeow', 'woofhellowoof']))
  t.deepEqual(resExitAllResult, [0, 0])
})
