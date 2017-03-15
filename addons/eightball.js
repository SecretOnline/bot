const ScriptAddon = require('../bot/ScriptAddon.js');

class Eightball extends ScriptAddon {
  constructor(bot) {
    super(bot, 'eightball');
  }

  get description() {
    return 'Adds a magic eight ball for your entertainment';
  }

  init() {
    
  }
}

module.exports = Eightball;
