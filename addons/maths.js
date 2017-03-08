const ScriptAddon = require('../bot/ScriptAddon.js');

class Maths extends ScriptAddon {
  constructor(bot) {
    super(bot, 'maths');
  }

  get description() {
    return 'Performs mathematical operations. Full documentation available at http://mathjs.org';
  }

  init() {

  }
}

module.exports = Maths;
