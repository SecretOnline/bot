'use strict';
var _bot;
var games = [];
var timeout;
var dataLocation = './data/games.json';
// var time = 2 * 1000;
var time = 30 * 60 * 1000;
// var variation = 1 * 1000;
var variation = 10 * 60 * 1000;

function init(bot) {
  _bot = bot;

  _bot.registerCommand('change-game', new _bot.Command(changeGame, 'core', _bot.Command.PermissionLevels.OVERLORD));

  _bot.watchFile(dataLocation, updateGamesList);

  pickRandomGame();
}

function deinit() {
  _bot.unwatchFile(dataLocation, updateGamesList);
  clearTimeout(timeout);
}

function updateGamesList(data) {
  try {
    games = JSON.parse(data);
  } catch (e) {
    games = games || [];
  }
}

function changeGame(input) {
  if (input.raw) {
    return input.process()
      .then((result) => {
        set(result);

        clearTimeout(timeout);

        return `set game to ${result}`;
      });
  } else {
    pickRandomGame();
    return 'going back to random games';
  }
}

function pickRandomGame() {
  var game = games[Math.floor(Math.random() * games.length)];

  set(game);

  var vary = Math.floor((Math.random() * variation * 2) - variation);
  timeout = setTimeout(pickRandomGame, time + vary);
}

function set(game) {
  var obj = {
    name: game
  };

  _bot.discord.User.setGame(obj);
}


module.exports = {
  init: init,
  deinit: deinit
};
