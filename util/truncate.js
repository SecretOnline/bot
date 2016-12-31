function truncate(str, len = 80, replace = '...') {
  if (str.length < len) {
    return str;
  } else {
    return `${str.substr(0, len - replace.length)}${replace}`;
  }
}

module.exports = truncate;
