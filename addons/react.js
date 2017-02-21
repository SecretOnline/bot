const ScriptAddon = require('../bot/ScriptAddon.js');

class Reactions extends ScriptAddon {
  constructor(bot) {
    super(bot, 'react');
  }

  get description() {
    return 'Addon that allows for the manipulation of emoji reactions on messages';
  }

  init() {

  }
}

module.exports = Reactions;
