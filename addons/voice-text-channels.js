'use strict';
var _bot;

var dataLocation = './data/voice-text-channels.json';
var servers = {};

function init(bot) {
  _bot = bot;

  _bot.registerCommand('link-voice-text', new _bot.Command(linkVoiceChannel, 'voice-text', _bot.Command.PermissionLevels.ADMIN));
  _bot.registerCommand('unlink-voice-text', new _bot.Command(unlinkVoiceChannel, 'voice-text', _bot.Command.PermissionLevels.ADMIN));

  _bot.watchFile(dataLocation, updateChannelLinking);
  // TODO: subscribe to voice channel join/leaving
}

function deinit() {
  _bot.unwatchFile(dataLocation, updateChannelLinking);
}

function updateChannelLinking(data) {
  // Parse data
  try {
    servers = JSON.parse(data);
    console.log('[voice-text] loaded channels');
  } catch (e) {
    servers = servers || {};
    console.error('[ERROR] failed to parse voice-text mapping');
    return;
  }
}

function linkVoiceChannel(input) {
  // TODO: this
}

function unlinkVoiceChannel(input) {
  // TODO: this
}


module.exports = {
  init,
  deinit
};
