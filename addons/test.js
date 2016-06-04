'use strict';
var _bot;

function init(bot) {
  _bot = bot;

  _bot.registerCommand('permtest', new _bot.Command(doTest, 'test', _bot.Command.PermissionLevels.ADMIN));
}

function doTest() {
  return 'permission test passed';
}


module.exports = {
  init: init
};
