'use strict';

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

function init(bot) {
  bot.registerCommand('say', new bot.Command(say, 'default', sayHelp));
  bot.registerCommand('raw', new bot.Command(raw, 'default', sayHelp));
  bot.registerCommand('wiki', new bot.Command(getWikiLink, 'default', linkHelp));
  bot.registerCommand('yt', new bot.Command(getYtLink, 'default', linkHelp));
  bot.registerCommand('google', new bot.Command(getGoogleLink, 'default', linkHelp));
  bot.registerCommand('lmgtfy', new bot.Command(getLmgtfyLink, 'default', linkHelp));
  bot.registerCommand('roll', new bot.Command(getRoll, 'default', rollHelp));
  bot.registerCommand('reverse', new bot.Command(reverse, 'default', reverseHelp));
  bot.registerCommand('unreverse', new bot.Command(reverse, 'default', unReverseHelp));
  // Latins
  bot.registerCommand('secret_latin', new bot.Command(getSecretText, 'latin'));
  bot.registerCommand('trk_latin', new bot.Command(getTrkText, 'latin'));
  bot.registerCommand('jaden_latin', new bot.Command(getJadenText, 'latin'));
  bot.registerCommand('alvv_latin', new bot.Command(getAlvvText, 'latin'));
  bot.registerCommand('ohdear_latin', new bot.Command(getMessText, 'latin'));
}

function say(input) {
  return input.process();
}

function raw(input) {
  return input.raw;
}

/*
 * Reverse taken from https://github.com/mathiasbynens/esrever/blob/master/src/esrever.js
 * to deal with javascript's unicode encoding
 */
function reverse(input) {
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
          return reverse($2) + $1;
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

function getWikiLink(input) {
  return input.process()
    .then((result) => {
      var url = 'https://en.wikipedia.org/wiki/';
      if (result)
        url += toTitleCase(result);
      else
        url += 'Main_Page';
      url = url.replace(/ /g, '_');
      url = encodeURI(url);
      url = url.replace(/'/g, '%27');

      return url;
    });
}

function getYtLink(input) {
  return input.process()
    .then((result) => {
      var url = 'https://www.youtube.com/';
      if (result)
        url += 'results?search_query=' + result;
      url = url.replace(/ /g, '+');
      url = encodeURI(url);
      url = url.replace(/'/g, '%27');

      return url;
    });

}

function getGoogleLink(input) {
  return input.process()
    .then((result) => {
      var url = 'https://www.google.com/';
      if (result)
        url += 'search?q=' + result;
      url = url.replace(/ /g, '+');
      url = encodeURI(url);
      url = url.replace(/'/g, '%27');

      return url;
    });
}

function getLmgtfyLink(input) {
  return input.process()
    .then((result) => {
      var url = 'http://lmgtfy.com/';
      if (result)
        url += '?q=' + result;
      url = url.replace(/ /g, '+');
      url = encodeURI(url);
      url = url.replace(/'/g, '%27');

      return url;
    });
}

function getSecretText(input) {
  return input.process()
    .then((result) => {
      return getSecretLatin(result);
    });
}

function getTrkText(input) {
  return input.process()
    .then((result) => {
      return getTrkLatin(result);
    });
}

function getJadenText(input) {
  return input.process()
    .then((result) => {
      return toTitleCase(result);
    });
}

function getAlvvText(input) {
  return input.process()
    .then((result) => {
      return getAlvvLatin(result);
    });
}

function getMessText(input) {
  return input.process()
    .then((result) => {
      return getSecretLatin(getTrkLatin(toTitleCase(result)));
    });
}

function getRoll(input) {
  return input.process()
    .then((result) => {
      var retString = "";
      result.split().forEach(function(roll) {
        if (roll.match(/\d+d\d+/)) {
          var rSplit = roll.split('d');
          var fResult = 0;
          var rolls = "";
          for (var i = 1; i <= rSplit[0]; i++) {
            var result = Math.floor(Math.random() * rSplit[1]) + 1;
            fResult += result;
            rolls += result + '';
            if (i != rSplit[0])
              rolls += '+';
          }
          retString += fResult + ' (' + rolls + ') ';
        } else
          retString += 'bad roll ';
      });
      return retString;
    });
}

/* "Latin" */
function getAlvvLatin(string) {
  var words = string.split(' ');
  for (var i = 0; i < words.length; i++) {
    if (words[i].length > 3) {
      if (words[i].indexOf('ing') === words[i].length - 3)
        words[i] = 'alvving';
      else if (words[i].indexOf('ed') === words[i].length - 2)
        words[i] = 'alvved';
      else if (words[i].indexOf('er') === words[i].length - 2)
        words[i] = 'alvver';
      else if (words[i].indexOf('n\'t') === words[i].length - 3)
        words[i] = 'alvvn\'t';
      else if (words[i].indexOf('nt') === words[i].length - 2)
        words[i] = 'alvvnt';
      else if (words[i].indexOf('\'s') === words[i].length - 2)
        words[i] = 'alvv\'s';
      else if (words[i].indexOf('es') === words[i].length - 2)
        words[i] = 'alvves';
      else if (words[i].indexOf('s') === words[i].length - 1)
        words[i] = 'alvvs';
      else if (words[i].indexOf('y') === words[i].length - 1)
        words[i] = 'alvvy';
      else
        words[i] = 'alvv';
    }
  }
  return words.join(' ');
}

function getSecretLatin(string) {
  var words = string.split(' ');
  for (var i = 0; i < words.length; i++) {
    if (words[i].length > 2)
      words[i] = words[i].substring(1, 2) + words[i].substring(0, 1) + words[i].substring(2);
  }
  return words.join(' ');
}

function getTrkLatin(string) {
  var newString = string.replace(/[aeiouc]/gi, '');
  return newString;
}

/**
 * Quick title case
 */
function toTitleCase(str) {
  return str.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

module.exports = {
  init: init
};
