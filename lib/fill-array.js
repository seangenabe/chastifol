module.exports = function fillArray(value, length) {
  var arr = []
  while (length--)
    arr[length] = value
  return arr
}
