const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');

let enablerHelp = [
  'syntax: `~<enable/disable>-addon <addon name>`',
  'the `enable/disable-addon` commands allow you to add and remove command groups from your server'
];
let channelFilterHelp = [
  'syntax: `~[dis]allow-channel <channel mention>`',
  'restricts secret_bot to specific channels',
  'by default bot is available on all channels',
  'adding a channel to the filter means secret_bot will only work in those channels'
];

class Enabler extends ScriptAddon {
  constructor(bot) {
    super(bot, 'core');
  }

  init() {
    this.bot.addCommand('enable-addon', new Command(this.addToServer.bind(this), 'core.enable', Command.PermissionLevels.ADMIN, enablerHelp));
    this.bot.addCommand('disable-addon', new Command(this.removeFromServer.bind(this), 'core.enable', Command.PermissionLevels.ADMIN, enablerHelp));
    this.bot.addCommand('allow-channel', new Command(this.addToFilter.bind(this), 'core.enable', Command.PermissionLevels.ADMIN, channelFilterHelp));
    this.bot.addCommand('disallow-channel', new Command(this.removeFromFilter.bind(this), 'core.enable', Command.PermissionLevels.ADMIN, channelFilterHelp));
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

    if (input.text.match(/^core(\.[\w._-]+)?$/)) {
      return `unable to disable \`${input.text}\``;
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

  addToFilter(input) {
    if (!input.message.channel instanceof Channel) {
      return 'allowing channels is not do-able for private messages';
    }

    let channel = input.message.connection.resolveMention(input.text);
    if (!(channel && channel instanceof Channel)) {
      return `unable to find channel \`${input.text}\``;
    }

    let serverConf = input.message.channel.server.getConfig();
    if (!serverConf.filter) {
      serverConf.filter = [];
    } else if (serverConf.filter.find(i => i === channel.id)) {
      return `channel \`${channel.mention()}\` is already in the filter`;
    }

    serverConf.filter.push(channel.id);

    input.message.channel.server.setConfig(serverConf);
    return `added ${channel.mention()} to the list of allowed channels`;
  }

  removeFromFilter(input) {
    if (!input.message.channel instanceof Channel) {
      return 'disallowing channels is not do-able for private messages';
    }

    let serverConf = input.message.channel.server.getConfig();
    if (!(serverConf.filter && serverConf.filter.length)) {
      return 'no channels were in filter to begin with';
    }

    let channel = input.message.connection.resolveMention(input.text);
    if (!channel) {
      return `unable to find channel \`${input.text}\``;
    }

    let index = serverConf.filter.indexOf(channel.id);
    if (index < 0) {
      return `\`${channel.mention()}\` wasn't in the filter`;
    }

    serverConf.filter.splice(index, 1);
    input.message.channel.server.setConfig(serverConf);
    return `removed ${channel.mention()} from the list of allowed channels`;
  }
}

module.exports = Enabler;
