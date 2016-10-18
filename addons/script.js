'use strict';

function init(bot) {

  bot.registerCommand('nowms', new bot.Command(nowMs, 'script'));
  bot.registerCommand('random', new bot.Command(randomPick, 'script'));
  bot.registerCommand('range', new bot.Command(getRange, 'script', bot.Command.PermissionLevels.OVERLORD));
}

function nowMs(input) {
  return input.process()
    .then((result) => {
      return `${Date.now()} ${result}`;
    });
}

function randomPick(input) {
  return input.process()
    .then((result) => {
      var words = result.split(' ');
      return words[Math.floor(Math.random() * words.length)];
    });
}

function getRange(input) {
  return input.process()
    .then((result) => {
      var args = result.split(' ');
      var ret = '';
      var a = Number.parseInt(args[0]);
      var b = Number.parseInt(args[1]);
      for (var i = a; i <= b; i++) {
        ret += i;
        if (i != b) {
          ret += ' ';
        }
      }
      return ret;
    });

}

module.exports = {
  init: init
};
