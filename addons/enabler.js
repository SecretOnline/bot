/* jslint node: true, esversion: 6 */
'use strict';
var _bot;

function init(bot) {
  _bot = bot;

  _bot.registerCommand('enable-addon', new _bot.Command(addToServer, 'core', _bot.Command.PermissionLevels.ADMIN));
  _bot.registerCommand('disable-addon', new _bot.Command(removeFromServer, 'core', _bot.Command.PermissionLevels.ADMIN));
}

function addToServer(input) {
  var serverId = input.originalMessage.guild.id;
  var conf = _bot.getServerConf(serverId);
  var index = conf.groups.indexOf(input.raw);
  if (index === -1) {
    conf.groups.push(input.raw);
    _bot.setServerConf(serverId, conf);
    return `enabled ${input.raw} for this server`;
  } else {
    return `${input.raw} was already enabled`;
  }

  return `added ${input.raw} to server`;
}

function removeFromServer(input) {
  var serverId = input.originalMessage.guild.id;
  var conf = _bot.getServerConf(serverId);
  var index = conf.groups.indexOf(input.raw);
  if (index > -1) {
    conf.groups.splice(index, 1);
    _bot.setServerConf(serverId, conf);
    return `disabled ${input.raw} for this server`;
  } else {
    return `${input.raw} wasn't enabled`;
  }

}


module.exports = {
  init: init
};
