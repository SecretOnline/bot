'use strict';
var fs = require('fs');

var triviaHelp = [
  'syntax: `~trivia <subcommand>`',
  'use `~trivia start` to start a round of trivia',
  '`~trivia status will show the current question again, if one is running`',
];
var answerHelp = [
  'syntax: `~a <your answer>`',
  'answers a trivia question'
];
var addRemoveHelp = [
  'syntax: `~<add/remove>-trivia <category>`',
  'adds or removes a trivia category to/from this server',
  '`~trivia categories` will show a list of all available categories'
];

var _bot;
var servers = {};
var watcher;
var dataLocation = './data/trivia.json';


function init(bot) {
  _bot = bot;

  bot.registerCommand('trivia', new bot.Command(getTrivia, 'trivia', triviaHelp));
  bot.registerCommand('t', new bot.Command(getTrivia, 'trivia', triviaHelp));
  bot.registerCommand('a', new bot.Command(getAnswer, 'trivia', answerHelp));
  bot.registerCommand('add-trivia', new bot.Command(addTrivia, 'trivia', bot.Command.PermissionLevels.ADMIN, addRemoveHelp));
  bot.registerCommand('remove-trivia', new bot.Command(removeTrivia, 'trivia', bot.Command.PermissionLevels.ADMIN, addRemoveHelp));

  try {
    servers = JSON.parse(fs.readFileSync(dataLocation));
  } catch (e) {
    servers = {};
    fs.writeFile(dataLocation, JSON.stringify(servers, null, 2));
  }

  watcher = fs.watch(dataLocation, (event, filename) => {
    if (event === 'change') {
      fs.readFile(dataLocation, (err, data) => {
        if (err) {
          console.error(`[Error] reading ${dataLocation}`);
          console.error(err);
          return;
        }

        try {
          servers = JSON.parse(data);
          console.log('reloaded trivia server config');
        } catch (err) {
          console.error(`[Error] parsing servers ${dataLocation}`);
          console.error(err);
          return;
        }
      });
    }
  });
}

function deinit() {
  watcher.close();
}

function getTrivia(input) {
  return 'NYI';
}

function getAnswer(input) {
  return 'NYI';
}

function addTrivia(input) {
  return 'NYI';
}

function removeTrivia(input) {
  return 'NYI';
}

module.exports = {
  init: init,
  deinit: deinit
};
