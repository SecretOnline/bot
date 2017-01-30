const ScriptAddon = require('../bot/ScriptAddon.js');

const historyHelp = [
  'syntax: `~history <number-of-messages> [user-mention]`',
  'gets the last <number> messages spoken in this channel',
  'adding a user mention filters to messages said by that person'
];

class History extends ScriptAddon {
  constructor(bot) {
    super(bot, 'history');
  }

  init() {
    this.addCommand('history', this.getHistory, historyHelp);
  }

  getHistory(input) {
    
  }
}

module.exports = History;
