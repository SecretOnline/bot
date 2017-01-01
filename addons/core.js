const Discord = require('discord.js');

const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');

let reloadHelp = 'really? you needed help for this? and you\'re the one in charge of this bot...';
let changePrefixHelp = [
  'syntax: `~change-prefix <character>`',
  'changes the prefix used to trigger commands',
  'default is `~`'
];
let changeColorHelp = [
  'syntax: `~change-color #<color>`',
  'changes the color secret_bot uses for embeds',
  'default is `#001855`'
];
let inviteHelp = 'gives you a link to invite the bot to your own discord server';

let inviteLink = 'https://discordapp.com/oauth2/authorize?client_id=177875535391752192&scope=bot&permissions=93184';

class Core extends ScriptAddon {
  constructor(bot) {
    super(bot, 'core');
  }

  init() {
    this.bot.addCommand('reload', new Command(this.doReload.bind(this), 'core', Command.PermissionLevels.OVERLORD, reloadHelp));
    this.bot.addCommand('change-prefix', new Command(this.changeCommandPrefix.bind(this), 'core', Command.PermissionLevels.ADMIN, changePrefixHelp));
    this.bot.addCommand('change-color', new Command(this.changeColor.bind(this), 'core', Command.PermissionLevels.ADMIN, changeColorHelp));
    this.bot.addCommand('bot-invite', new Command(this.getDiscordInviteLink.bind(this), 'core.invites.discord', inviteHelp));
  }

  deinit() {
    // Do nothing
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
    if (!input.message.channel instanceof Discord.TextChannel) {
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
    if (!input.message.channel instanceof Discord.TextChannel) {
      return 'unable to change color for private messages';
    }

    // You need something to set it to, duh
    if (input.text) {
      // Take first character of raw input
      var color = input.text.split(' ').shift();

      if (!color.match(/#[0-9a-fA-F]{6}/)) {
        return `${color} isn't a hex colour`;
      }

      var server = input.message.channel.server;

      // Set command prefix
      var serverConf = server.getConfig();
      serverConf.color = color;
      this.bot.setConfig(server, serverConf);

      return `embed color changed to \`${color}\``;
    } else {
      return 'no color specified';
    }
  }

  getDiscordInviteLink(input) {
    // Just return link if more than this command, otherwise give a bigger description
    if (input.message.text.split(' ').length === 1) {
      return [
        'here\'s the link to invite secret_bot to your own Discord server',
        inviteLink
      ].join('\n');
    } else {
      return inviteLink;
    }
  }
}

module.exports = Core;
