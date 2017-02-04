const ytdl = require('ytdl-core');
const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');

class Music extends ScriptAddon {
  constructor(bot) {
    super(bot, 'music');
  }

  init() {
    this.addCommand('enable-music', this.enableServer, Command.PermissionLevels.OVERLORD);
    this.addCommand('disable-music', this.disableServer, Command.PermissionLevels.ADMIN);
  }

  checkEnabled(guild) {
    if (!guild) {
      return false;
    }

    let conf = this.getConfig(guild);
    return !!conf.enabled; // Force it to be a boolean
  }

  enableServer(input) {
    if (!input.message.guild) {
      return 'music is only available on servers';
    }

    if (this.checkEnabled(input.message.guild)) {
      return 'music is already enabled on this server';
    }

    let conf = this.getConfig(input.message.guild);
    conf.enabled = true;
    this.setConfig(conf, input.message.guild);
    return 'music has been enabled on this server';
  }

  disableServer(input) {
    if (!input.message.guild) {
      return 'music is only available on servers';
    }
    
    if (!this.checkEnabled(input.message.guild)) {
      return 'music is already disabled on this server';
    }

    let conf = this.getConfig(input.message.guild);
    conf.enabled = false;
    this.setConfig(conf, input.message.guild);
    return 'music has been disabled on this server';
  }
}

module.exports = Music;
