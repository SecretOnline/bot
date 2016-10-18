const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');
const Channel = require('../bot/Channel.js');

let enablerHelp = [
  'syntax: `~<enable/disable>-addon <addon name>`',
  'the `enable/disable-addon` commands allow you to add and remove command groups from your server'
];

class Enabler extends ScriptAddon {
  constructor(bot) {
    super(bot, 'core');
  }

  init() {
    this.bot.addCommand('enable-addon', new Command(this.addToServer.bind(this), 'core', Command.PermissionLevels.ADMIN, enablerHelp));
    this.bot.addCommand('disable-addon', new Command(this.removeFromServer.bind(this), 'core', Command.PermissionLevels.ADMIN, enablerHelp));
  }

  deinit() {
    // Do nothing
  }

  addToServer(input) {
    if (!input.message.channel instanceof Channel) {
      return 'enabling addons is not allowed for private messages';
    }

    let serverConf = input.message.channel.server.getConfig();
    if (serverConf.addons) {
      if (serverConf.addons.includes(input.text)) {
        return `${input.text} is already enabled on this server`;
      } else {
        serverConf.addons.push(input.text);
      }
    } else {
      serverConf.addons = [input.text];
    }

    input.message.channel.server.setConfig(serverConf);
    return `enabled ${input.text} on this server`;
  }

  removeFromServer(input) {
    if (!input.message.channel instanceof Channel) {
      return 'disabling addons is not allowed for private messages';
    }

    let serverConf = input.message.channel.server.getConfig();
    if (serverConf.addons) {
      if (serverConf.addons.includes(input.text)) {
        let index = serverConf.addons.indexOf(input.text);
        serverConf.addons.splice(index, 1);
        input.message.channel.server.setConfig(serverConf);
        return `disabled ${input.text} on this server`;
      } else {
        if (this.bot.getConfig('default').addons.includes(input.text)) {
          return `${input.text} is a default addon, and can't be disabled`;
        } else {
          return `${input.text} is already disabled on this server`;
        }
      }
    } else {
      return `${input.text} is already disabled on this server`;
    }
  }
}

module.exports = Enabler;
