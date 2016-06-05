'use strict';
var _bot;

function init(bot) {
  _bot = bot;

  bot.registerCommand('commands', new bot.Command(getCommands, 'core'));
  bot.registerCommand('help', new bot.Command(getHelp, 'core'));
  bot.registerCommand('which', new bot.Command(getWhich, 'core', bot.Command.PermissionLevels.ADMIN));
}

function getWhich(input) {
  var comm = _bot.getCommand(input.raw, input.originalMessage);
  if (comm) {
    return `\`${input.raw}\` is from ${comm.group}`;
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
  if (input.raw) {
    if (input.raw.toLowerCase() === 'commands') {
      return getCommands(input);
    } else {
      return 'NYI';
    }
  } else {
    _bot.sendToUser(`secret_bot help
secret_bot v6.2.x - the helpful update

secret_bot is written by secret_online
https://github.com/SecretOnline/bot
`, input.originalMessage.author);
  }

  return '';
}

module.exports = {
  init: init
};
