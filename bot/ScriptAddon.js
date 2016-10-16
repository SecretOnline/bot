const Addon = require('./Addon.js');

class ScriptAddon extends Addon {
  constructor(bot, filename = 'NONAME') {
    super(bot, filename);

    this.conf = bot.getConfig(this);
  }

  init() {
    return Promise.reject('ScriptAddon didn\'t overwrite init');
  }

  deinit() {
    return Promise.reject('ScriptAddon didn\'t overwrite deinit');
  }
}

module.exports = ScriptAddon;
