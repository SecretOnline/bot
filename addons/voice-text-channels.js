'use strict';
var _bot;

var dataLocation = './data/voice-text-channels.json';
var servers = {};

function init(bot) {
  _bot = bot;

  _bot.registerCommand('link-voice-text', new _bot.Command(linkVoiceChannel, 'voice-text', _bot.Command.PermissionLevels.ADMIN));
  _bot.registerCommand('unlink-voice-text', new _bot.Command(unlinkVoiceChannel, 'voice-text', _bot.Command.PermissionLevels.ADMIN));

  _bot.watchFile(dataLocation, updateChannelLinking);

  _bot.discord.Dispatcher.on('VOICE_CHANEL_JOIN', voiceJoin);
  _bot.discord.Dispatcher.on('VOICE_CHANEL_LEAVE', voiceLeave);
}

function deinit() {
  _bot.unwatchFile(dataLocation, updateChannelLinking);

  _bot.discord.Dispatcher.off('VOICE_CHANEL_JOIN', voiceJoin);
  _bot.discord.Dispatcher.off('VOICE_CHANEL_LEAVE', voiceLeave);
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

function voiceJoin(info) {
  var serverConf = servers[info.guildId];
  if (serverConf) {
    var roleId = serverConf[info.channelId];
    if (roleId) {
      var server = info.channel.guild;
      var user = info.user.memberOf(server);
      user.assignRole(roleId);
    }
  }
}

function voiceLeave(info) {
  var serverConf = servers[info.guildId];
  if (serverConf) {
    var roleId = serverConf[info.channelId];
    if (roleId) {
      var server = info.channel.guild;
      var user = info.user.memberOf(server);
      var role = server.roles.find(r => r.id === roleId);
      user.unassignRole(roleId);
    }
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
