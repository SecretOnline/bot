function arrayRandom(arr) {
  if (arr.length) {
    let index = Math.floor(Math.random() * arr.length);
    return arr[index];
  }
}

module.exports = arrayRandom;
