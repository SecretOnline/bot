const ScriptAddon = require('../bot/ScriptAddon.js');

class NoMansSky extends ScriptAddon {
  constructor(bot) {
    super(bot, 'nms');
  }

  get description() {
    return 'A set of commands for a No Man\'s Sky Discord server';
  }

  init() {
    this.addCommand('isanyoneplayingnms', this.isAnyonePlaying);
  }

  isAnyonePlaying(input) {
    let members = input.message.channel.members;
    let count = members
      .map((member) => {
        return member.presence.game;
      })
      .filter(g => g === 'No Man\'s Sky')
      .length;
  
    if (count) {
      return `yes, ${count} are playing right now`;
    } else {
      return 'no';
    }
  }
}

module.exports = NoMansSky;
