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
  
    return `there are ${count} people playing No Man's Sky right now on this server`;
  }
}

module.exports = NoMansSky;
