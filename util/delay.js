/**
 * Returns a promise that resolves with no content after
 * the given number of milliseconds have passed
 *
 * @param {number} ms Number of milliseconds to delay by
 * @returns
 */
function delay(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}

module.exports = delay;
