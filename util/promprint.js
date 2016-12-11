function prnt(str) {
  return (res) => {
    console.log(str); // eslint-disable-line no-console
    return res;
  };
}

module.exports = prnt;
