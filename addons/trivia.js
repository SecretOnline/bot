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
var trivia = {};
var watcher;
var dataLocation = './data/trivia.json';
var serversLocation = './data/trivia-servers.json';


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
  return 'NYI';
}

function addTrivia(input) {
  return 'NYI';
}

function removeTrivia(input) {
  return 'NYI';
}

function reloadTrivia(input) {

}

module.exports = {
  init: init,
  deinit: deinit
};
