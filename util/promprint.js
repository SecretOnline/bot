/**
 * Gives a function that when called prints the message this function was given
 * Intended for Promise callbacks, or similar uses
 *
 * @param {string} str Message to print
 * @returns Callback to print string
 */
function prnt(str) {
  return (res) => {
    console.log(str); // eslint-disable-line no-console
    return res;
  };
}

module.exports = prnt;
