'use strict';
var fs = require('fs');

var _bot;
var commandLists = {};
var dataLocation = './data/custom-commands.json';
var watcher;

function init(bot) {
  _bot = bot;

  bot.registerCommand('add-command', new bot.Command(addCommand, 'core', bot.Command.PermissionLevels.ADMIN));

  commandLists = JSON.parse(fs.readFileSync(dataLocation));

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
  return input.process()
    .then((result) => {
      var server = input.originalMessage.guild.id;
      var parts = result.split(' ');
      var trigger = parts.shift();
      var response = parts.join(' ');
      // Save to file
      commandLists[server][trigger] = response;
      fs.writeFile(dataLocation, JSON.stringify(commandLists, null, 2));

      _bot.registerCommand(trigger, new _bot.Command(response, `custom-${server}`));

      return `added ~${trigger} to server`;
    });
}


module.exports = {
  init: init,
  deinit: deinit
};
