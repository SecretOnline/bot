/**
 * Runs over async functions in squence
 * 
 * @param {Array<function>} functions Functions to run
 * @returns {Promise}
 */
function promiseChain(functions) {
  if (functions.length === 0) {
    return Promise.resolve();
  }
  return functions.reduce((prom, nextFunc) => {
    return prom
      .then((res) => {
        return nextFunc(res);
      });
  }, Promise.resolve());
}

module.exports = promiseChain;
