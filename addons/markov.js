const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');

class Markov extends ScriptAddon {
  constructor(bot) {
    super(bot, 'markov');
  }

  init() {

  }
}

module.exports = Markov;
