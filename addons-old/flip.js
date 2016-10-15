var flipHelp = [
  'this command will flip any text upside down',
  '(not all characters work just yet. soon(tm))',
  'example usage:',
  '``~flip example text`',
  '``~flip ~dance`'
];

function init(bot) {
  bot.registerCommand('flip', new bot.Command(getFlip, 'default', flipHelp));
}

function getFlip(input) {
  return input.process()
    .then((result) => {
      return flip(result);
    });
}

function flip(aString) {
  var last = aString.length - 1;
  var result = new Array(aString.length);
  for (var i = last; i >= 0; --i) {
    var c = aString.charAt(i);
    var r = flipTable[c];
    result[last - i] = r !== undefined ? r : c;
  }
  return result.join('');
}
var flipTable = {
  a: '\u0250',
  b: 'q',
  c: '\u0254',
  d: 'p',
  e: '\u01DD',
  f: '\u025F',
  g: '\u0183',
  h: '\u0265',
  i: '\u0131',
  j: '\u027E',
  k: '\u029E',
  l: '\u05DF',
  m: '\u026F',
  n: 'u',
  r: '\u0279',
  t: '\u0287',
  v: '\u028C',
  w: '\u028D',
  y: '\u028E',
  '.': '\u02D9',
  '[': ']',
  '(': ')',
  '{': '}',
  '?': '\u00BF',
  '!': '\u00A1',
  "\'": ',',
  '<': '>',
  '_': '\u203E',
  '"': '\u201E',
  '\\': '\\',
  ';': '\u061B',
  '\u203F': '\u2040',
  '\u2045': '\u2046',
  '\u2234': '\u2235',
  'A': '∀',
  'B': '\u029A',
  'C': '\u0186',
  'D': '\u2C6D',
  'E': '\u018E',
  //'F': '',
  //'G': '',
  //'J': '',
  //'K': '',
  'L': '˥',
  'M': 'W',
  'P': '\u0500',
  //'Q': '',
  'R': '\u1D1A',
  'T': '\u2534',
  'U': '\u2229',
  'V': '\u039B',
  'Y': '\u03BB',
  '（': '）',
  '☜': '☞',
  '˳': '°',
  '⌐': '¬',
  '┌': '┘',
  '┐': '└',
  '͜': '͡',
  'ʕ': 'ʖ'
};
for (var i in flipTable) {
  flipTable[flipTable[i]] = i;
}

module.exports = {
  init: init
};
