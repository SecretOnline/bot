'use strict';
var _bot;

function init(bot) {
  _bot = bot;

  bot.registerCommand('commands', new bot.Command(getCommands, 'core', bot.Command.PermissionLevels.DEFAULT, getCommands));
  bot.registerCommand('help', new bot.Command(getHelp, 'core'));
  bot.registerCommand('which', new bot.Command(getWhich, 'core', bot.Command.PermissionLevels.ADMIN));
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
        response = `secret_bot help -> ${input.raw}

${help}`;
      } else {
        response = `no help specified for ${input.raw}`;
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
