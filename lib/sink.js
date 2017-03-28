const PassThrough = require('stream').PassThrough

// accepts input from multiple readable streams
// ends only when all readable streams end
module.exports = class Sink extends PassThrough {

  constructor(options) {
    super(options)
    this.states = []
    this._finalized = false
  }

  checkFinalized() {
    if (this._finalized) {
      throw new Error("Already finalized the list of source streams.")
    }
  }

  addReadable(readable) {
    this.checkFinalized()

    readable.pipe(this, { end: false })

    let state = new Promise((resolve, reject) => {
      readable.on('end', resolve)
      readable.on('error', reject)
    })
    this.states.push(state)
  }

  finalize() {
    this.checkFinalized()

    Promise.all(this.states)
      .then(() => {
        // End this stream.
        this.end()
      })
      .catch(err => {
        this.emit('error', err)
      })
  }

}
