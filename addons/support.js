const Discord = require('discord.js');

const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');

let supportHelp = [
  'syntax: `~support <reason>`',
  'creates a new support request',
  'will message you an invite code to join a channel where you can recieve help',
  'do *NOT* abuse this, or secret_bot will be removed from your server permanently'
];

class Support extends ScriptAddon {
  constructor(bot) {
    super(bot, 'support');

    this.discord = bot.discord;
  }

  init() {
    this.bot.addCommand('support', new Command(this.getSupport.bind(this), 'core.help.support', Command.PermissionLevels.ADMIN, supportHelp));
  }

  deinit() {
    // Do nothing
  }

  getSupport(input) {
    if (!input.message.channel instanceof Discord.TextChannel) {
      return 'this command must be done in a server';
    }

    if (!input.text) {
      return 'you must provide a reason for support';
    }

    let message = input.message;
    let conf = this.getConfig('default');
    let server = this.discord.guilds.get(conf.server);
    let id = message.id;

    if (!server.available) {
      return 'error communicating with Discord. not sure how this message got through';
    }

    let supportRole = server.roles.get(conf['support-role']);

    let roleProm = server.createRole({
      name: `support-${id}`
    });
    let channelProm = roleProm
      .then((role) => {
        let templateChannel = server.channels.get(conf['template-channel']);
        return templateChannel.clone(`support-${id}`)
        .then((channel) => {
          return Promise.all([
            channel.overwritePermissions(supportRole, {
              'READ_MESSAGES': true,
              'SEND_MESSAGES': true,
              'MANAGE_MESSAGES': true
            }),
            channel.overwritePermissions(role, {
              'READ_MESSAGES': true,
              'SEND_MESSAGES': true
            })
          ])
            .then(() => {
              return channel;
            });
        });
      });

    let inviteProm = channelProm
      .then((channel) => {
        return channel.createInvite({
          maxAge: 60,
          maxUses: 2
        });
      });

    return Promise.all([
      channelProm,
      roleProm,
      inviteProm
    ])
      .then(([channel, role, invite]) => {
        let chanEmbed = new Discord.RichEmbed()
          .setTitle('new support request')
          .setDescription(supportRole.toString())
          .addField('Reason', input.text)
          .addField('User', `${message.author.toString()}`, true)
          .addField('Server', `${message.guild.name}\n${message.guild.id}`, true);
        let userEmbed = new Discord.RichEmbed()
          .setTitle('new support request')
          .setDescription(`a new support request has been created. here is an invite to a channel where you can get help: ${invite.toString()}`)
          .addField('Reason', input.text);

        return Promise.all([
          this.bot.send(channel, chanEmbed),
          this.bot.send(message.author, userEmbed)
        ]);
      })
      .then(() => {
        return '';
      });
  }
}

module.exports = Support;
