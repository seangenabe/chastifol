'use strict'

const PassThrough = require('stream').PassThrough

// accepts input from multiple readable streams
// ends only when all readable streams end
module.exports = class Sink extends PassThrough {

  constructor(options) {
    super(options)
    this.readables = []
  }

  addReadable(readable) {
    readable.pipe(this, { end: false })
    let store = { ended: false }
    this.readables.push(store)
    readable.on('end', () => {
      store.ended = true
      for (let readable of this.readables) {
        if (!readable.ended) { return }
      }
      this.end()
    })
  }
}
