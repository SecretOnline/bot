'use strict';
var _bot;

var reloadHelp = 'really? you needed help for this? and you\'re the one in charge of this bot...';
var changeCharHelp = [
  'syntax: `~change-char <character>`',
  'changes the character used to trigger commands',
  'default is `~`'
];
var inviteHelp = 'gives you a link to invite the bot to your own discord server';

var inviteLink = 'https://discordapp.com/oauth2/authorize?client_id=177875535391752192&scope=bot';

function init(bot) {
  _bot = bot;

  _bot.registerCommand('reload', new _bot.Command(doReload, 'core', _bot.Command.PermissionLevels.OVERLORD, reloadHelp));
  _bot.registerCommand('change-char', new _bot.Command(changeCommandChar, 'core', _bot.Command.PermissionLevels.ADMIN, changeCharHelp));
  _bot.registerCommand('bot-invite', new _bot.Command(getInviteLink, 'core', inviteHelp));
}

function doReload() {
  return _bot.forceReload();
}

function changeCommandChar(input) {
  // You need something to set it to, duh
  if (input.raw) {
    // Take first character of raw input
    var character = input.raw.charAt(0);
    var server = input.originalMessage.guild.id;

    // Set command prefix character
    var serverConf = _bot.getServerConf(server);
    serverConf.char = character;
    _bot.setServerConf(server, serverConf);

    return `command character changed to \`${character}\``;
  } else {
    return 'no character specified';
  }
}

function getInviteLink(input) {
  // Just return link if more than this command, otherwise give a bigger description
  if (input.originalMessage.content.split(' ').length === 1) {
    return [
      'here\'s the link to invite secret_bot to your own Discord server',
      inviteLink
    ].join('\n');
  } else {
    return inviteLink;
  }
}


module.exports = {
  init: init
};
