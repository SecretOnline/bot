/**
 * Truncates a string
 *
 * @param {string} str String to truncate
 * @param {number} [len=80] Length to truncate to
 * @param {string} [replace='...'] String to replace end with
 * @returns
 */
function truncate(str, len = 80, replace = '...') {
  if (str.length < len) {
    return str;
  } else {
    return `${str.substr(0, len - replace.length)}${replace}`;
  }
}

module.exports = truncate;
