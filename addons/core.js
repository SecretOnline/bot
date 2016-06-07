'use strict';
var _bot;

var reloadHelp = 'really? you needed help for this? and you\'re the one in charge of this bot...';
var changeCharHelp = [
  'syntax: `~change-char <character>`',
  'changes the character used to trigger commands',
  'default is `~`'
];

function init(bot) {
  _bot = bot;

  _bot.registerCommand('reload', new _bot.Command(doReload, 'core', _bot.Command.PermissionLevels.OVERLORD, reloadHelp));
  _bot.registerCommand('change-char', new _bot.Command(changeCommandChar, 'core', _bot.Command.PermissionLevels.ADMIN, changeCharHelp));
}

function doReload() {
  return _bot.forceReload();
}

function changeCommandChar(input) {
  if (input.raw) {
    var character = input.raw.charAt(0);
    var server = input.originalMessage.guild.id;
    var serverConf = _bot.getServerConf(server);

    serverConf.char = character;

    _bot.setServerConf(server, serverConf);

    return `command character changed to \`${character}\``;
  } else {
    return 'no character specified';
  }
}


module.exports = {
  init: init
};
