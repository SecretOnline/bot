const Discord = require('discord.js');

const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');

// const time = 2 * 1000;
const gameChangeTime = 30 * 60 * 1000;
// const variation = 1 * 1000;
const gameChangeVariation = 10 * 60 * 1000;

const enablerHelp = [
  'syntax: `~<enable/disable>-addon <addon name>`',
  'the `enable/disable-addon` commands allow you to add and remove command groups from your server'
];
const channelFilterHelp = [
  'syntax: `~[dis]allow-channel <channel mention>`',
  'restricts secret_bot to specific channels',
  'by default bot is available on all channels',
  'adding a channel to the filter means secret_bot will only work in those channels'
];
const reloadHelp = 'really? you needed help for this? and you\'re the one in charge of this bot...';
const changePrefixHelp = [
  'syntax: `~change-prefix <character>`',
  'changes the prefix used to trigger commands',
  'default is `~`'
];
const changeColorHelp = [
  'syntax: `~change-color #<color>`',
  'changes the color secret_bot uses for embeds',
  'default is `#001855`'
];
const inviteHelp = 'gives you a link to invite the bot to your own discord server';
const sourceHelp = 'displays information about secret_bot\'s source code';

const inviteLink = 'https://discordapp.com/oauth2/authorize?client_id=177875535391752192&scope=bot&permissions=93184';
const sourceLink = 'https://github.com/SecretOnline/bot';

class Core extends ScriptAddon {
  constructor(bot) {
    super(bot, 'core');

    this.desc = 'Contains commands that are important for the bot\'s functionality';

    this.games = this.getConfig('default').games;
    this.timeout;

    this.pickRandomGame();
  }

  init() {
    this.addCommand('reload', this.doReload, Command.PermissionLevels.OVERLORD, reloadHelp);
    this.addCommand('change-prefix', this.changeCommandPrefix, Command.PermissionLevels.ADMIN, changePrefixHelp);
    this.addCommand('change-color', this.changeColor, Command.PermissionLevels.ADMIN, changeColorHelp);
    this.addCommand('bot-invite', this.getDiscordInviteLink, inviteHelp);
    this.addCommand('source', this.getSourceInfo, sourceHelp);
    this.addCommand('enable-addon', this.addToServer, Command.PermissionLevels.ADMIN, enablerHelp);
    this.addCommand('disable-addon', this.removeFromServer, Command.PermissionLevels.ADMIN, enablerHelp);
    this.addCommand('allow-channel', this.addToFilter, Command.PermissionLevels.ADMIN, channelFilterHelp);
    this.addCommand('disallow-channel', this.removeFromFilter, Command.PermissionLevels.ADMIN, channelFilterHelp);
    this.addCommand('change-game', this.changeGame, Command.PermissionLevels.OVERLORD);
  }

  doReload(input) {
    input.user.send('reloading is not suported yet');
    return '';
    // return this.bot.reloadAddons()
    //   .then(() => {
    //     input.user.send('reload complete');
    //     return '';
    //   });
  }

  changeCommandPrefix(input) {
    if (!(input.message.channel instanceof Discord.TextChannel)) {
      return 'unable to change prefix for private messages';
    }

    // You need something to set it to, duh
    if (input.text) {
      // Take first character of raw input
      var prefix = input.text.split(' ').shift();
      var server = input.message.guild;

      // Set command prefix
      var serverConf = this.bot.getConfig(server);
      serverConf.prefix = prefix;
      this.bot.setConfig(server, serverConf);

      return `command prefix changed to \`${prefix}\``;
    } else {
      return 'no prefix specified';
    }
  }

  changeColor(input) {
    if (!(input.message.channel instanceof Discord.TextChannel)) {
      return 'unable to change color for private messages';
    }

    // You need something to set it to, duh
    if (input.text) {
      // Take first character of raw input
      var color = input.text.split(' ').shift();

      if (!color.match(/#[0-9a-fA-F]{6}/)) {
        return `${color} isn't a hex colour`;
      }

      var server = input.message.guild;

      // Set command prefix
      var serverConf = this.bot.getConfig(server);
      serverConf.color = color;
      this.bot.setConfig(server, serverConf);

      return `embed color changed to \`${color}\``;
    } else {
      return 'no color specified';
    }
  }

  getDiscordInviteLink(input) {
    // Just return link if more than this command, otherwise give a bigger description
    if (input.message.content.split(' ').length === 1) {
      return [
        'here\'s the link to invite secret_bot to your own Discord server',
        inviteLink
      ].join('\n');
    } else {
      return inviteLink;
    }
  }

  getSourceInfo(input) {
    // Try find the summary command, just for fun
    let prefix = this.bot.getConfig('default').prefix;
    let channel = input.message.channel;

    if (channel instanceof Discord.TextChannel) {
      let serverConf = this.bot.getConfig(input.message.guild);
      if (serverConf.prefix) {
        prefix = serverConf.prefix;
      }
    }

    return input.from(`${prefix}summaries.github ${sourceLink}`)
      .process()
      .catch(() => {
        return sourceLink;
      });
  }

  addToServer(input) {
    if (!(input.message.channel instanceof Discord.TextChannel)) {
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
    if (!(input.message.channel instanceof Discord.TextChannel)) {
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
    if (!(input.message.channel instanceof Discord.TextChannel)) {
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
    if (!(input.message.channel instanceof Discord.TextChannel)) {
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

  updateGamesList(data) {
    try {
      this.games = JSON.parse(data);
      this.log('loaded games');
    } catch (e) {
      this.games = this.games || [];
    }
  }

  changeGame(input) {
    if (input.text) {
      return input.process()
        .then((result) => {
          this.setGameText(result.text);

          clearTimeout(this.timeout);

          return `set game to ${result.text}`;
        });
    } else {
      if (this.timeout) {
        clearTimeout(this.timeout);
      }
      this.pickRandomGame();
      return 'going back to random games';
    }
  }

  pickRandomGame() {
    if (this.games.length === 0) {
      throw new Error('no games to choose');
    }

    var game = this.games[Math.floor(Math.random() * this.games.length)];

    var vary = Math.floor((Math.random() * gameChangeVariation * 2) - gameChangeVariation);
    this.timeout = setTimeout(this.pickRandomGame.bind(this), gameChangeTime + vary);

    this.setGameText(game);
  }

  setGameText(game) {
    this.log(`set game to ${game}`);
    this.bot.discord.user.setGame(game);
  }
}

module.exports = Core;
