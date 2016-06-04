/* jslint node: true, esversion: 6 */
'use strict';
var _bot;

function init(bot) {
  _bot = bot;

  _bot.registerCommand('reload', new _bot.Command(doReload, 'core', {}));
}

function doReload() {
  return _bot.forceReload();
}


module.exports = {
  init: init
};
