const emoji = require('node-emoji');
const ScriptAddon = require('../bot/ScriptAddon.js');

const regionalIndicators = {
  a: '🇦',
  b: '🇧',
  c: '🇨',
  d: '🇩',
  e: '🇪',
  f: '🇫',
  g: '🇫',
  h: '🇭',
  i: '🇮',
  j: '🇯',
  k: '🇰',
  l: '🇱',
  m: '🇲',
  n: '🇳',
  o: '🇴',
  p: '🇵',
  q: '🇶',
  r: '🇷',
  s: '🇸',
  t: '🇹',
  u: '🇺',
  v: '🇻',
  w: '🇼',
  x: '🇽',
  y: '🇾',
  z: '🇿'
};

class Reactions extends ScriptAddon {
  constructor(bot) {
    super(bot, 'react');
  }

  get description() {
    return 'Addon that allows for the manipulation of emoji reactions on messages';
  }

  init() {
    this.addCommand('react-type', this.wordReaction);
  }

  wordReaction(input) {
    return input.process()
      .then((res) => {
        let letters = res.toLowerCase().match(/[a-z]/g);
        if (letters.length > 20) {
          throw 'reactions can\'t be longer than 20 characters';
        }
        let set = new Set(letters);
        if (letters.length !== set.size) {
          throw 'reactions can\'t have duplicate letters';
        }

        return letters;
      })
      .then((letters) => {
        let ms = input.message.channel.messages.array();
        if (ms.length < 2) {
          throw 'secret_bot can\'t find the last message';
        }
        let message = ms[ms.length - 2];
        if (!message) {
          throw 'can\'t find message to react to';
        }

        // Function that returns a function for a Promise
        let nextLetter = (index) => {
          return () => {
            if (index >= letters.length) {
              return Promise.resolve();
            }
            return message.react(regionalIndicators[letters[index]])
              .then(nextLetter(index + 1));
          };
        };

        return new Promise(nextLetter(0));
      })
      .then(() => {
        return ''; // Don't send a message
      });
  }
}

module.exports = Reactions;
