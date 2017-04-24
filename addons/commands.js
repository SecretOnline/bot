const ScriptAddon = require('../bot/ScriptAddon.js');
const Animation = require('../bot/Animation.js');
const {arrayRandom} = require('../util');

const sayHelp = [
  'syntax: `~<say/raw> <text to output>`',
  'takes some text, and outputs it',
  '`~say` processes the text, while `~raw` does not',
  'example usage:',
  '~say ~lenny',
  '~raw ~lenny'
];
const rollHelp = [
  'syntax: `~roll <roll> [more rolls]`',
  'where a roll is in the format `ndm`, `n` being the number of dice to roll, and `m` being the magnitude of the dice',
  'example usage:',
  '~roll 4d6',
  '~roll 1d20'
];
const unReverseHelp = 'takes a reversed string and puts it the right way around';
const reverseHelp = 'takes a string and reverses the letter order';
const randomHelp = [
  'syntax: `~random <option> <option> [more options]`',
  'selects one of the options given in the list',
  'example usage:',
  '~random Imperial Stormcloak',
  '~random "Procrastinate for a few hours" "Add commands to secret_bot" Study'
];
const flipHelp = [
  'this command will flip any text upside down',
  '(not all characters work just yet. soon(tm))',
  'this is caused by Unicode not having upside down versions of all characters, and don\'t expect them to be added any time soon',
  'example usage:',
  '`~flip example text`',
  '`~flip ~dance`'
];
const eightBallHelp = [
  'syntax: `~eightball <yes/no question>`',
  ''
];

class Comm extends ScriptAddon {
  constructor(bot) {
    super(bot, 'default');

    this.desc = 'Contains some basic and useful commands';
  }

  init() {
    this.addCommand('say', this.say, sayHelp);
    this.addCommand('raw', this.raw, sayHelp);
    this.addCommand('roll', this.getRoll, rollHelp);
    this.addCommand('reverse', this.reverse, reverseHelp);
    this.addCommand('unreverse', this.reverse, unReverseHelp);
    this.addCommand('random', this.random, randomHelp);
    this.addCommand('flip', this.getFlip, flipHelp);
    this.addCommand('eightball', this.getEightball, eightBallHelp);
  }

  say(input) {
    return input.process()
      .then((res) => {
        return res.text;
      });
  }

  raw(input) {
    return input.text;
  }

  /*
   * Reverse taken from https://github.com/mathiasbynens/esrever/blob/master/src/esrever.js
   * to deal with javascript's unicode encoding (at least part of it)
   */
  reverse(input) {
    return input.process()
      .then((result) => {
        var regexSurrogatePair = /([\uD800-\uDBFF])([\uDC00-\uDFFF])/g;
        let text = result.text
          // Swap high and low surrogates so the low surrogates go first
          .replace(regexSurrogatePair, '$2$1');
        // Step 2: reverse the code units in the string
        var ret = '';
        var index = text.length;
        while (index--) {
          ret += text.charAt(index);
        }
        return ret;
      });
  }

  getRoll(input) {
    return input.process()
      .then((result) => {
        let dice = result.args
          .filter(r => r.match(/^\d+d\d+$/));

        if (dice.length === 0) {
          throw 'you just include a roll in your message. see `~help roll` for more information';
        }

        let rollResults = dice
          .map((roll) => {
            let [num, mag] = roll.split('d');
            let values = [];

            for (let i = 0; i < num; i++) {
              values.push(Math.floor(Math.random() * mag) + 1);
            }

            return values;
          });

        let total = rollResults.reduce((total, current) => {
          return total + current.reduce((a, b) => a + b, 0);
        }, 0);
        let rolls = rollResults.reduce((all, current) => {
          return all.concat(current);
        }, []);

        return `${total} (${rolls.join('+')})`;
      });
  }

  random(input) {
    return input.process()
      .then((res) => {
        return arrayRandom(res.args);
      });
  }

  getFlip(input) {
    return input.process()
      .then((result) => {
        return this.flip(result.text);
      });
  }

  flip(aString) {
    var last = aString.length - 1;
    var result = new Array(aString.length);
    for (var i = last; i >= 0; --i) {
      var c = aString.charAt(i);
      var r = flipTable[c];
      result[last - i] = r !== undefined ? r : c;
    }
    return result.join('');
  }

  getEightball(input) {
    return input.process()
      .then((res) => {
        res.add(new Animation([
          ...eightballFrames,
          `${eightballFrames[0]} ${arrayRandom(eightBallResponses)}`
        ], EIGHTBALL_DELAY, eightballColor));
        res.add(''); // Since processed text isn't relevant for this command

        return res;
      });
  }
}

const flipTable = {
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
  '\'': ',',
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
for (let i in flipTable) {
  flipTable[flipTable[i]] = i;
}

const eightBallResponses = [
  'It is certain',
  'It is decidedly so',
  'Without a doubt',
  'Yes definitely',
  'You may rely on it',
  'As I see it, yes',
  'Most likely',
  'Outlook good',
  'Yes',
  'Signs point to yes',
  'Reply hazy, try again',
  'Ask again later',
  'Better not tell you now',
  'Cannot predict now',
  'Concentrate and ask again',
  'Don\'t count on it',
  'My reply is no',
  'My sources say no',
  'Outlook not so good',
  'Very doubtful'
];
const eightballColor = '#292F33';
const eightballFrames = [
  '🎱⚫⚫',
  '⚫🎱⚫',
  '⚫⚫🎱',
  '⚫🎱⚫',
  '🎱⚫⚫'
];
const EIGHTBALL_DELAY = 1000;

module.exports = Comm;
