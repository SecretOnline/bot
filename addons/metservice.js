const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');

const request = require('../util').request;

class MetService extends ScriptAddon {
  constructor(bot) {
    super(bot, 'metservice');
  }

  init() {

  }

  deinit() {
    // Do nothing
  }
}

module.exports = MetService;
