
var split = require('split')
var EOL = require('os').EOL

module.exports = function pipeToStream(inputStream, outputStream, commandIndex, commandText, commandChalk, cp) {
  if (outputStream == null) return
  if (Array.isArray(outputStream)) {
    outputStream = outputStream[commandIndex]
  }
  if (outputStream == null) return
  if (typeof outputStream === 'function') {
    // Invoke function.
    outputStream = outputStream(commandIndex, commandText)
  }
  if (commandChalk) {
    // Color each line.
    inputStream.pipe(split())
    .on('data', function(line) {
      outputStream.write(commandChalk(commandIndex + ' out>') + line + EOL)
    })
    return
  }
  else {
    // Pipe directly to stream.
    inputStream.pipe(outputStream)
  }
}
