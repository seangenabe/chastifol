const Transform = require('stream').Transform

// input should be line chunks piped from `split`
// outputs each chunk prepended with a string, plus LF
module.exports = class Prepender extends Transform {

  constructor(options) {
    super(options)
    this.options = options
  }

  _transform(chunk, encoding, callback) {
    callback(null, `${this.options.prepend}${chunk}\n`)
  }

}
