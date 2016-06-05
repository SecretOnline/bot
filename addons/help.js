'use strict';
var _bot;

function init(bot) {
  _bot = bot;

  bot.registerCommand('commands', new bot.Command(getCommands, 'core'));
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

module.exports = {
  init: init
};
