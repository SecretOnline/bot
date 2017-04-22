const ScriptAddon = require('../bot/ScriptAddon.js');
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
}

module.exports = Comm;
