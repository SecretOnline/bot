/**
 * Runs over async functions in squence
 *
 * @param {Array<function>} functions Functions to run\
 * @param {any} initial Initial value
 * @returns {Promise}
 */
function promiseChain(functions, initial) {
  if (functions.length === 0) {
    return Promise.resolve();
  }
  return functions.reduce((prom, nextFunc) => {
    return prom
      .then((res) => {
        return nextFunc(res);
      });
  }, Promise.resolve(initial));
}

module.exports = promiseChain;
