'use strict';
var _bot;

function init(bot) {
  _bot = bot;

  _bot.registerCommand('permtest', new _bot.Command(doTest, 'test', _bot.Command.PermissionLevels.ADMIN));
  _bot.registerCommand('reject', new _bot.Command(rejecter, 'test', _bot.Command.PermissionLevels.OVERLORD));
}

function doTest() {
  return 'permission test passed';
}

function rejecter(input) {
  return input.process()
    .then((result) => {
      return new Promise((resolve, reject) => {
        reject(result);
      });
    });
}


module.exports = {
  init: init
};
