'use strict';
var _bot;

var reloadHelp = 'really? you needed help for this? and you\'re the one in charge of this bot...';

function init(bot) {
  _bot = bot;

  _bot.registerCommand('reload', new _bot.Command(doReload, 'core', _bot.Command.PermissionLevels.OVERLORD, reloadHelp));
}

function doReload() {
  return _bot.forceReload();
}


module.exports = {
  init: init
};
