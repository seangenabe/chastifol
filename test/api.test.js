'use strict'

const Chastifol = require('./../lib/chastifol')
const concat = require('concat-stream')
const chai = require('chai')
const expect = chai.expect
chai.use(require('chai-as-promised'))
const PassThrough = require('stream').PassThrough

describe('API', function() {

  this.timeout(5000)

  it('should not run', function() {
    let c = Chastifol([])
    expect(c).to.be.an.instanceof(Chastifol)
    expect(c.exitCodes).to.have.members([])
    return expect(c.exitAll).to.be.fulfilled
  })

  it('should be able to be instantiated', function() {
    let c = new Chastifol([])
    expect(c).to.be.an.instanceof(Chastifol)
    expect(c.exitCodes).to.have.members([])
    expect(c.exitAll).to.not.exist
    c.start()
    return expect(c.exitAll).to.be.fulfilled
  })

  it('should run the scripts without error', async function() {
    let out1, out2
    let out1Promise = new Promise(resolve => {
      out1 = concat(resolve)
    })
    let out2Promise = new Promise(resolve => {
      out2 = concat(resolve)
    })
    let c = Chastifol(
      [
        'node test/recho a b c',
        'node test/recho "def egh" "i" "j\\k\\l"'
      ],
      {
        out: [
          out1,
          out2
        ]
      }
    )
    expect(c.childProcesses).to.be.an.instanceof(Array)
    expect(c.childProcesses).to.have.length(2)
    await expect(c.exitAll).to.eventually.deep.equal([0, 0])

    return await Promise.all([
      expect(out1Promise.then(value => value.toString().trim()))
        .to.eventually.equal('a#b#c'),
      expect(out2Promise.then(value => value.toString().trim()))
        .to.eventually.equal('def egh#i#j\\k\\l')
    ])
  })

  it('should run the scripts with nonzero exit code', function() {
    let c = Chastifol(
      [
        'exit 0',
        'exit 5'
      ]
    )
    return expect(c.exitAll).to.eventually.deep.equal([0, 5])
  })

  it('should accept single out stream', async function() {
    let out, p = new Promise(resolve => { out = concat(resolve) })
    let out1, p1 = new Promise(resolve => { out1 = concat(resolve) })
    let out2, p2 = new Promise(resolve => { out2 = concat(resolve) })
    let res =
      Chastifol(['node test/recho a', 'node test/recho b'], { out })
    res.childProcesses[0].stdout.pipe(out1)
    res.childProcesses[1].stdout.pipe(out2)
    await expect(res.exitAll).to.eventually.deep.equal([0, 0])
    return await Promise.all([
      expect(p.then(value =>
        value.toString().trim().split('\n').filter(Boolean))
      )
        .to.eventually.have.members(['a', 'b']),
      expect(p1.then(value => value.trim())).to.eventually.equal('a'),
      expect(p2.then(value => value.trim())).to.eventually.equal('b')
    ])
  })

  it('should be able to read from a single input stream', async function() {
    let stream = new PassThrough()
    let out, p = new Promise(resolve => { out = concat(resolve) })
    let res =
      Chastifol(
        ['node test/catty', 'node test/catty woof'],
        { in: stream, out }
      )
    stream.end('hello')
    await expect(res.exitAll).to.eventually.deep.equal([0, 0])
    return await Promise.all([
      expect(p.then(value =>
        value.toString().trim().split('\n').filter(Boolean)
      ))
        .to.eventually.have.members(['meowhellomeow', 'woofhellowoof'])
    ])
  })
})
