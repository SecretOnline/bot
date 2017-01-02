const Addon = require('./Addon.js');

class ScriptAddon extends Addon {
  constructor(bot, filename = 'NONAME') {
    super(bot, filename);
  }

  init() {
    return Promise.reject('ScriptAddon didn\'t overwrite init');
  }

  deinit() {
    return Promise.reject('ScriptAddon didn\'t overwrite deinit');
  }

  getConfig(server) {
    return this.bot.getConfig(this, server);
  }

  setConfig(conf, server) {
    return this.bot.setConfig(this, conf, server);
  }
}

module.exports = ScriptAddon;
