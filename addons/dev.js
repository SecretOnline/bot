// This addon only works for Discord at the moment
const Discord = require('discord.js');

const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');

class Dev extends ScriptAddon {
  constructor(bot) {
    super(bot, 'dev');
  }

  init() {

  }

  deinit() {
    // Do nothing
  }
}

module.exports = Dev;
