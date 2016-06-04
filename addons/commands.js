'use strict';

function init(bot) {
  bot.registerCommand('say', new bot.Command(say, 'default'));
  bot.registerCommand('raw', new bot.Command(raw, 'default'));
  bot.registerCommand('wiki', new bot.Command(getWikiLink, 'default'));
  bot.registerCommand('yt', new bot.Command(getYtLink, 'default'));
  bot.registerCommand('google', new bot.Command(getGoogleLink, 'default'));
  bot.registerCommand('lmgtfy', new bot.Command(getLmgtfyLink, 'default'));
  bot.registerCommand('roll', new bot.Command(getRoll, 'default'));
  // Latins
  bot.registerCommand('secret_latin', new bot.Command(getSecretText, 'latin'));
  bot.registerCommand('trk_latin', new bot.Command(getTrkText, 'latin'));
  bot.registerCommand('jaden_latin', new bot.Command(getJadenText, 'latin'));
  bot.registerCommand('alvv_latin', new bot.Command(getAlvvText, 'latin'));
  bot.registerCommand('ohdear_latin', new bot.Command(getMessText, 'latin'));
}

function say(input) {
  return input.process()
    .then((result) => {
      return result;
    });
}

function raw(input) {
  return input.raw;
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
