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

  try {
    commandLists = JSON.parse(fs.readFileSync(dataLocation));
  } catch (e) {
    commandLists = {};
    fs.writeFileSync(dataLocation, JSON.stringify(commandLists, null, 2));
  }

  Object.keys(commandLists).forEach(function(id) {
    var commands = commandLists[id];
    Object.keys(commands).forEach(function(trigger) {
      _bot.registerCommand(trigger, new _bot.Command(commands[trigger], `custom-${id}`));
    });
  });

  watcher = fs.watch(dataLocation, (event, filename) => {
    if (event === 'change') {
      fs.readFile(dataLocation, (err, data) => {
        if (err) {
          console.error(`[Error] reading ${dataLocation}`);
          console.error(err);
          return;
        }

        try {
          commandLists = JSON.parse(data);
          console.log('reloaded commands');
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
