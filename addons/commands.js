const ScriptAddon = require('../bot/ScriptAddon.js');
const {arrayRandom, quoteSplit} = require('../util');

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
  '~roll 5d6',
  '~roll 1d20',
  '~roll 3d6 2d4'
];
const unReverseHelp = 'takes a reversed string and puts it the right way around';
const reverseHelp = 'takes a string and reverses the letter order';
const randomHelp = [
  'syntax: `~random <option> <option> [more options]`',
  'selects one of the options given in the list',
  'example usage:',
  '~random Imperial Stormcloak',
  '~random ~randomcat ~randomdog',
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
    return input.process();
  }

  raw(input) {
    return input.raw;
  }

  /*
   * Reverse taken from https://github.com/mathiasbynens/esrever/blob/master/src/esrever.js
   * to deal with javascript's unicode encoding
   */
  reverse(input) {
    return input.process()
      .then((result) => {
        var regexSymbolWithCombiningMarks = /(<%= allExceptCombiningMarks %>)(<%= combiningMarks %>+)/g;
        var regexSurrogatePair = /([\uD800-\uDBFF])([\uDC00-\uDFFF])/g;
        // Step 1: deal with combining marks and astral symbols (surrogate pairs)
        let text = result.text
          // Swap symbols with their combining marks so the combining marks go first
          .replace(regexSymbolWithCombiningMarks, function($0, $1, $2) {
            // Reverse the combining marks so they will end up in the same order
            // later on (after another round of reversing)
            return this.reverse($2) + $1;
          })
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
        var retString = '';
        result.text.split().forEach(function(roll) {
          if (roll.match(/\d+d\d+/)) {
            var rSplit = roll.split('d');
            var fResult = 0;
            var rolls = '';
            for (var i = 1; i <= rSplit[0]; i++) {
              var result = Math.floor(Math.random() * rSplit[1]) + 1;
              fResult += result;
              rolls += result + '';
              if (i !== rSplit[0]) {
                rolls += '+';
              }
            }
            retString += fResult + ' (' + rolls + ') ';
          } else {
            retString += 'bad roll ';
          }
        });
        return retString;
      });
  }

  random(input) {
    return input.process()
      .then((res) => {
        return arrayRandom(quoteSplit(res.text));
      });
  }
}

module.exports = Comm;
