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
var current = {};
var trivia = {};
var watcher;
var dataLocation = './data/trivia.json';
var serversLocation = './data/trivia-servers.json';
var maxGuesses = 5;


function init(bot) {
  _bot = bot;

  bot.registerCommand('trivia', new bot.Command(getTrivia, 'trivia', triviaHelp));
  bot.registerCommand('t', new bot.Command(getTrivia, 'trivia', triviaHelp));
  bot.registerCommand('a', new bot.Command(getAnswer, 'trivia', answerHelp));
  bot.registerCommand('add-trivia', new bot.Command(addTrivia, 'trivia', bot.Command.PermissionLevels.ADMIN, addRemoveHelp));
  bot.registerCommand('remove-trivia', new bot.Command(removeTrivia, 'trivia', bot.Command.PermissionLevels.ADMIN, addRemoveHelp));

  bot.watchFile(dataLocation, updateTriviaList);
  bot.watchFile(serversLocation, updateServerList);
}

function deinit() {
  _bot.unwatchFile(dataLocation, updateTriviaList);
  _bot.unwatchFile(serversLocation, updateServerList);
}

function updateServerList(data) {
  try {
    servers = JSON.parse(data);
    console.log('[trivia] loaded server data');
  } catch (e) {
    servers = servers || {};
    console.error('[ERROR] failed to parse trivia server lists');
  }
}

function updateTriviaList(data) {
  try {
    trivia = JSON.parse(data);
    console.log('[trivia] loaded trivia list');
  } catch (e) {
    trivia = trivia || {};
    console.error('[ERROR] failed to parse trivia list');
  }
}

function getTrivia(input) {
  return 'NYI';
}

function getAnswer(input) {
  return new Promise((resolve, reject) => {
    var id = input.originalMessage.guild.id;
    var user = input.user.id;
    var curr = current[id];
    var server = servers[id];

    if (!server) {
      resolve('this server has not set up trivia yet');
      return;
    }

    if (!curr) {
      resolve('there is no active question right now');
      return;
    }

    if (curr.guesses[user]) {
      curr.guesses[user].push(input.raw);

      if (curr.guesses[user].length > 5) {
        resolve(`sorry, ${input.user.name}, you've already guessed too much`);
        return;
      }
    } else {
      curr.guesses[user] = [input.raw];
    }

    if (input.raw.toLowerCase() === curr.question.q.toLowerCase()) {
      var r = `${input.user.name} guessed correctly!`;

      nextQuestion(input.originalMessage.guild)
        .then((newQ) => {
          return new Promise((res2, rej2) => {

            var newPoints = _bot.getPoints(input.user, input.originalMessage.guild);
            _bot.setPoints(input.user, input.originalMessage.guild, newPoints);

            var ret = [
              r,
              `you now have ${newPoints} point${newPoints === 1 ? '' : 's'}`,
              `next question: ${newQ}`
            ];
            resolve(ret.join('\n'));
          });

        }, (err) => {
          if (typeof err === 'string') {
            resolve(`${r}\n${err}`);
          } else {
            reject(err);
          }
        });
    } else {
      var remainingGuesses = maxGuesses - curr.guesses[user].length;
      resolve(`incorrect guess, ${input.user.name}. you have ${remainingGuesses} guess${remainingGuesses === 1 ? '' : 'es'} remaining`);
    }

  });

}

function addTrivia(input) {
  return 'NYI';
}

function removeTrivia(input) {
  return 'NYI';
}

function nextQuestion(server) {
  return new Promise((resolve, reject) => {
    var id = server.id;

    if (!servers[id]) {
      servers[id] = {
        categories: [],
        points: {},
        name: server.name
      };

      fs.writeFile(dataLocation, JSON.stringify(servers, null, 2));
    }

    var allowedCategories = servers[id].categories;

    if (!allowedCategories.length) {
      reject('unable to choose a question as no categories are enabled');
      return;
    }

    var qList = [];

    allowedCategories.forEach((cat) => {
      if (trivia[cat]) {
        trivia[cat].forEach((q) => {
          qList.push(q);
        });
      }
    });

    if (!qList.length) {
      reject('unable to choose a question as there were none to choose from');
      return;
    }

    current[id] = current[id] || {};

    if (current[id].currQuestion) {
      var question = randomFromArray(qList.filter((item) => {
        return current[id].currQuestion !== item;
      }));
      resolve(question);
    } else {
      resolve(randomFromArray(qList));
    }
  });
}

function randomFromArray(arr) {
  var index = Math.floor(Math.random() * arr.length);
  return arr[index];
}

module.exports = {
  init: init,
  deinit: deinit
};
