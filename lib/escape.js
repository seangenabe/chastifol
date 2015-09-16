
// TODO: Just use `shell-escape`. Or else just publish this as a new module.

var validFilename = require('valid-filename')

function validWithoutEscape(x) {
  return x === '&' ||
    x === '&&' ||
    x === '||' ||
    x === '|' ||
    x === '<' ||
    x === '>' ||
    validFilename(x) && !/\s/.test(x)
}

module.exports = function(args) {
  var ret = []
  for (var i = 0, len = args.length; i < len; i++) {
    var arg = args[i]
    if (typeof arg === 'string') {
      // Tolerate base filenames.
      // This ensures shell commands (i.e. exit, echo, etc.) won't be escaped incorrectly.
      if (validWithoutEscape(arg)) {
        ret.push(arg)
      }
      else {
        // Wrap and escape.
        ret.push("\"" + arg.replace("\"", "\\\"") + "\"")
      }
    }
    else {
      // Tolerate other types of arguments coming from e.g. minimist
      ret.push(arg)
    }
  }
  return ret.join(' ')
}
