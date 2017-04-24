/**
 * Splits a string by words, except if inside "" or ``
 *
 * @param {string} str String to split
 * @returns
 */
function quoteSplit(str) {
  let arr = [];
  let exp = /(?:([^\"\`]\S*)|\"(.*?)\"|\`(.*?)\`)\s*/g;

  let item = exp.exec(str);
  while (item !== null) {
    let words = item[1] || item[2] || '';
    arr.push(words);
    item = exp.exec(str);
  }

  return arr;
}

module.exports = quoteSplit;
