/**
 * Returns the first given parameter that is not null, or null if they all are
 *
 * @param {any} options
 * @returns
 */
function firstNotNull(...options) {
  for (var i = 0; i < options.length; i++) {
    if (options[i] !== null) {
      return options[i];
    }
  }
  return null;
}

module.exports = firstNotNull;
