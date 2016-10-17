const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');
const Channel = require('../bot/Channel.js');

let reloadHelp = 'really? you needed help for this? and you\'re the one in charge of this bot...';
let changePrefixHelp = [
  'syntax: `~change-char <character>`',
  'changes the character used to trigger commands',
  'default is `~`'
];
let inviteHelp = 'gives you a link to invite the bot to your own discord server';

let inviteLink = 'https://discordapp.com/oauth2/authorize?client_id=177875535391752192&scope=bot';

class Core extends ScriptAddon {
  constructor(bot) {
    super(bot, 'core');
  }

  init() {
    this.bot.addCommand('reload', new Command(this.doReload.bind(this), 'core', Command.PermissionLevels.OVERLORD, reloadHelp));
    this.bot.addCommand('change-prefix', new Command(this.changeCommandPrefix.bind(this), 'core', Command.PermissionLevels.ADMIN, changePrefixHelp));
    this.bot.addCommand('bot-invite', new Command(this.getInviteLink.bind(this), 'core', inviteHelp));
  }

  deinit() {
    // Do nothing
  }

  doReload(input) {
    return this.bot.reloadAddons()
      .then(() => {
        input.user.send('reload complete');
        return '';
      });
  }

  changeCommandPrefix(input) {
    if (!input.message.channel instanceof Channel) {
      return 'unable to change prefix for private channels';
    }

    // You need something to set it to, duh
    if (input.text) {
      // Take first character of raw input
      var prefix = input.text.split(' ').shift();
      var server = input.message.channel.server;

      // Set command prefix
      var serverConf = server.getConfig();
      serverConf.prefix = prefix;
      server.setConfig(serverConf);

      return `command prefix changed to \`${prefix}\``;
    } else {
      return 'no character specified';
    }
  }

  getInviteLink(input) {
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
