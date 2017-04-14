const ScriptAddon = require('../bot/ScriptAddon.js');

class Translate extends ScriptAddon {
  constructor(bot) {
    super(bot, 'translate');
  }

  get description() {
    return 'Allows secret_bot to translate messages';
  }

  init() {

  }
}

module.exports = Translate;
