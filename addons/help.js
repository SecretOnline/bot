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
  var available = _bot.commandList(input.originalMessage);
  var serverConf = _bot.getServerConf(input.originalMessage.guild.id);

  var reply = `secret_bot help -> commands
config for server: ${input.originalMessage.guild.name}
command groups enabled: ${serverConf.groups.join(', ')}

commands: \`${serverConf.char}${available.sort().join(`\`, \`${serverConf.char}`)}\``;

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
