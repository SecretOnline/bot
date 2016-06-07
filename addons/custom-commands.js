'use strict';
var fs = require('fs');

var commandHelp = [
  'syntax: `~<add/remove>-command <command trigger> <words to output>`',
  'allows the addition of custom commands to each server',
  'commands created on one server *can not* be used on another, unless the second server enables it',
  'the words to output follow the same rules as JSON command loading',
  '`{args}` will be replaced by any processed text after this command',
  '`{user}` will be replaced by the name of the user who sent the command',
  'example usage:',
  '~add-command self-ban {user} has been banned for {args}!'
];

var _bot;
var commandLists = {};
var dataLocation = './data/custom-commands.json';
var watcher;

function init(bot) {
  _bot = bot;

  bot.registerCommand('add-command', new bot.Command(addCommand, 'core', bot.Command.PermissionLevels.ADMIN, commandHelp));
  bot.registerCommand('remove-command', new bot.Command(removeCommand, 'core', bot.Command.PermissionLevels.ADMIN, commandHelp));

  _bot.watchFile(dataLocation, updateCommandLists);
}

function deinit() {
  _bot.unwatchFile(dataLocation, updateCommandLists);
}

function updateCommandLists(data) {
  try {
    commandLists = JSON.parse(data);
    console.log('[comm] loaded commands');
  } catch (e) {
    commandLists = commandLists || {};
    console.error('[ERROR] failed to parse command lists');
  }
}

function addCommand(input) {
  return new Promise((resolve, reject) => {
    var server = input.originalMessage.guild.id;
    var parts = input.raw.split(' ');
    var trigger = parts.shift();
    var response = parts.join(' ');
    // Save to file
    commandLists[server] = commandLists[server] || {};
    commandLists[server][trigger] = response;

    var res = _bot.registerCommand(trigger, new _bot.Command(response, `custom-${server}`));
    if (res) {
      fs.writeFile(dataLocation, JSON.stringify(commandLists, null, 2), (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(`added \`~${trigger}\` to server`);
      });
    } else {
      resolve(`\`~${trigger}\` is already added`);
    }
  });
}

function removeCommand(input) {
  return new Promise((resolve, reject) => {
    var server = input.originalMessage.guild.id;
    var trigger = input.raw.split(' ')[0];
    // Save to file
    commandLists[server] = commandLists[server] || {};

    delete commandLists[server][trigger];

    fs.writeFile(dataLocation, JSON.stringify(commandLists, null, 2));

    _bot.deregisterCommand(trigger, `custom-${server}`);

    fs.writeFile(dataLocation, JSON.stringify(commandLists, null, 2), (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(`removed \`~${trigger}\` from server`);
    });
  });
}


module.exports = {
  init: init,
  deinit: deinit
};
