'use strict';
var _bot;

var helpHelp = [
  'syntax: `~help [command]`',
  'did you think there\'d be something secret here?'
];
var whichHelp = [
  'syntax: `~which <command>`',
  'alows you to find out which command group a command belongs to'
];

function init(bot) {
  _bot = bot;

  bot.registerCommand('commands', new bot.Command(getCommands, 'core', getCommands));
  bot.registerCommand('help', new bot.Command(getHelp, 'core', helpHelp));
  bot.registerCommand('which', new bot.Command(getWhich, 'core', bot.Command.PermissionLevels.ADMIN, whichHelp));
}

function getWhich(input) {
  var serverConf = _bot.getServerConf(input.originalMessage.guild.id);
  var comm = _bot.getCommand(`${serverConf.char}${input.raw}`, input.originalMessage);
  if (comm) {
    return `\`${serverConf.char}${input.raw}\` is from ${comm.group}`;
  } else {
    return `unknown or disallowed command: ${input.raw}`;
  }
}

function getCommands(input) {
  var serverConf = _bot.getServerConf(input.originalMessage.guild.id);
  var available = [];
  var reply = '';
  if (input.raw) {
    available = _bot.commandList(input.originalMessage, input.raw);

    reply = `secret_bot help -> commands -> ${input.raw}
config for server: ${input.originalMessage.guild.name}

commands: ${available.sort().map((item) => {
  return `\`${serverConf.char}${item}\``;
}).join(', ')}`;

  } else {
    available = _bot.commandList(input.originalMessage);

    reply = `secret_bot help -> commands
config for server: ${input.originalMessage.guild.name}
command groups enabled: ${serverConf.groups.join(', ')}

commands: ${available.sort().map((item) => {
  return `\`${serverConf.char}${item}\``;
}).join(', ')}`;
  }

  _bot.sendToUser(reply, input.originalMessage.author);

  // Don't send anything to server channel
  return '';
}

function getHelp(input) {
  var response;

  if (input.raw) {
    // Get command
    var serverConf = _bot.getServerConf(input.originalMessage.guild.id);
    var comm = _bot.getCommand(`${serverConf.char}${input.raw}`, input.originalMessage);
    if (comm) {
      var help = comm.help(input.from(''));

      // Return on empty string. Allows for a no-response
      if (help === '') {
        return '';
      }

      if (help) {
        let header = [
          `secret_bot help -> ${input.raw}`,
          `command group: ${comm.group}`
        ];
        if (comm.permission) {
          switch (comm.permission) {
            case 1:
              header.push('permission required: Admin');
              break;
            case 2:
              header.push('permission required: Overlord');
              break;
          }
        }

        response = [
          ...header,
          '',
          help
        ].join('\n');
      } else {
        response = `there is no help for ${input.raw}`;
      }
    } else {
      response = `unknown or disallowed command: ${input.raw}`;
    }
  } else {
    response = `secret_bot help
secret_bot v6.2.x - the helpful update

secret_bot is written by secret_online
https://github.com/SecretOnline/bot`;
  }

  _bot.sendToUser(response, input.originalMessage.author);
  return '';
}

module.exports = {
  init: init
};
