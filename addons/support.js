const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');

class Support extends ScriptAddon {
  constructor(bot) {
    super(bot, 'core');

    this.discord = bot.discord;
  }

  init() {
    
  }

  deinit() {
    // Do nothing
  }
}

module.exports = Support;
