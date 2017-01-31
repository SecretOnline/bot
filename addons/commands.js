const ScriptAddon = require('../bot/ScriptAddon.js');

var sayHelp = [
  'syntax: `~<say/raw> <text to output>`',
  'takes some text, and outputs it',
  '`~say` processes the text, while `~raw` does not',
  'example usage:',
  '~say ~lenny',
  '~raw ~lenny'
];
var linkHelp = [
  'syntax: `~<google,wiki,yt,lmgtfy> [search]`',
  'builds a clickable link to the appropriate service'
];
var rollHelp = [
  'syntax: `~roll <roll> [more rolls]`',
  'where a roll is in the format `ndm`, `n` being the number of dice to roll, and `m` being the magnitude of the dice',
  'example usage:',
  '~roll 5d6',
  '~roll 1d20'
];
var unReverseHelp = 'takes a reversed string and puts it the right way around';
var reverseHelp = 'takes a string and reverses the letter order';

class Comm extends ScriptAddon {
  constructor(bot) {
    super(bot, 'default');
  }

  init() {
    this.addCommand('say', this.say, sayHelp);
    this.addCommand('raw', this.raw, sayHelp);
    this.addCommand('wiki', this.getWikiLink, linkHelp);
    this.addCommand('yt', this.getYtLink, linkHelp);
    this.addCommand('lmgtfy', this.getLmgtfyLink, linkHelp);
    this.addCommand('roll', this.getRoll, rollHelp);
    this.addCommand('reverse', this.reverse, reverseHelp);
    this.addCommand('unreverse', this.reverse, unReverseHelp);
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
        result = result
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
        var index = result.length;
        while (index--) {
          ret += result.charAt(index);
        }
        return ret;
      });
  }

  getWikiLink(input) {
    return input.process()
      .then((result) => {
        var url = 'https://en.wikipedia.org/wiki/';
        if (result) {
          url += this.toTitleCase(result);
        } else {
          url += 'Main_Page';
        }
        url = url.replace(/ /g, '_');
        url = encodeURI(url);
        url = url.replace(/'/g, '%27');

        return url;
      });
  }

  getYtLink(input) {
    return input.process()
      .then((result) => {
        var url = 'https://www.youtube.com/';
        if (result) {
          url += 'results?search_query=' + result;
        }
        url = url.replace(/ /g, '+');
        url = encodeURI(url);
        url = url.replace(/'/g, '%27');

        return url;
      });

  }

  getLmgtfyLink(input) {
    return input.process()
      .then((result) => {
        var url = 'http://lmgtfy.com/';
        if (result) {
          url += '?q=' + result;
        }
        url = url.replace(/ /g, '+');
        url = encodeURI(url);
        url = url.replace(/'/g, '%27');

        return url;
      });
  }

  getRoll(input) {
    return input.process()
      .then((result) => {
        var retString = '';
        result.split().forEach(function(roll) {
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
}

module.exports = Comm;
