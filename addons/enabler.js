const Discord = require('discord.js');

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
    if (!input.message.channel instanceof Discord.TextChannel) {
      return 'enabling addons is not allowed for private messages';
    }

    let serverConf = this.bot.getConfig(input.message.guild);
    if (serverConf.addons) {
      if (serverConf.addons.includes(input.text)) {
        return `${input.text} is already enabled on this server`;
      } else {
        serverConf.addons.push(input.text);
      }
    } else {
      serverConf.addons = [input.text];
    }

    this.bot.setConfig(input.message.guild, serverConf);
    return `enabled ${input.text} on this server`;
  }

  removeFromServer(input) {
    if (!input.message.channel instanceof Discord.TextChannel) {
      return 'disabling addons is not allowed for private messages';
    }

    if (input.text.match(/^core(\.[\w._-]+)?$/)) {
      return `unable to disable \`${input.text}\``;
    }

    let serverConf = this.bot.getConfig(input.message.guild);
    if (serverConf.addons) {
      if (serverConf.addons.includes(input.text)) {
        let index = serverConf.addons.indexOf(input.text);
        serverConf.addons.splice(index, 1);
        this.bot.setConfig(input.message.guild, serverConf);
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
    if (!input.message.channel instanceof Discord.TextChannel) {
      return 'allowing channels is not allowed for private messages';
    }

    let serverConf = this.bot.getConfig(input.message.guild);
    if (!serverConf.filter) {
      serverConf.filter = [];
    }

    let channels = input.message.mentions.channels;

    if (channels.length === 0) {
      return 'no channels were specified';
    }

    channels = channels
      .map((channel) => {
        if (serverConf.filter.find(i => i === channel.id)) {
          return undefined;
        }
        return channel;
      })
      // Remove and undefineds
      .filter(i=>i);

    if (channels.length === 0) {
      return 'all channels listed were already in the list';
    }

    channels.forEach((channel) => {
      serverConf.filter.push(channel.id);
    });

    this.bot.setConfig(input.message.guild, serverConf);
    return `added ${channels.map(c=>c.toString()).join(', ')} to the list of allowed channels`;
  }

  removeFromFilter(input) {
    if (!input.message.channel instanceof Discord.TextChannel) {
      return 'disallowing channels is not allowed for private messages';
    }

    let serverConf = this.bot.getConfig(input.message.guild);
    if (!serverConf.filter) {
      serverConf.filter = [];
    }

    let channels = input.message.mentions.channels;

    if (channels.length === 0) {
      return 'no channels were specified';
    }

    channels
      .map((channel) => {
        if (serverConf.filter.find(i => i === channel.id)) {
          return channel;
        }
        return undefined;
      })
      // Remove and undefineds
      .filter(i=>i);

    if (channels.length === 0) {
      return 'none of the given channels were in the list';
    }

    channels.forEach((channel) => {
      let index = serverConf.filter.indexOf(channel.id);
      if (index > -1) {
        serverConf.filter.splice(index, 1);
      }
    });

    return `removed ${channels.map(c=>c.toString()).join(', ')} from the list of allowed channels`;
  }
}

module.exports = Enabler;
