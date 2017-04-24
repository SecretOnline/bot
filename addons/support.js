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

    this.desc = 'Allows server admins to get in contact with people who can help with secret_bot';
    this.discord = bot.discord;
  }

  init() {
    this.addCommand('support', this.getSupport, Command.PermissionLevels.ADMIN, supportHelp);

    // Add support-close command to support server only
    let conf = this.getConfig('default');
    let supportServerAddon = this.bot.getServerAddon(conf.server);
    supportServerAddon.addCommand('support-close', this.closeSupport.bind(this));
    this.log(`added ~support-close to ${conf.server}`);
  }

  getSupport(input) {
    if (!(input.message.channel instanceof Discord.TextChannel)) {
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
          .setDescription('hey @everyone, we need someone over here!')
          .addField('Reason', input.text)
          .addField('User', `${message.author.toString()}`, true)
          .addField('Server', `${message.guild.name}\n${message.guild.id}`, true)
          .addField('Channel', `${message.channel.name}\n${message.channel.id}`, true)
          .setFooter('type `~support-close` when you\'re finished and i\'ll clean up');
        let userEmbed = new Discord.RichEmbed()
          .setTitle('new support request')
          .setDescription(`a new support request has been created. here is an invite to a channel where you can get help: ${invite.toString()}`)
          .addField('Reason', input.text);

        return Promise.all([
          this.bot.send(channel, chanEmbed, false, false),
          this.bot.send(message.author, userEmbed)
        ]);
      })
      .then(() => {
        return '';
      });
  }

  closeSupport(input) {
    if (!(input.message.channel instanceof Discord.TextChannel)) {
      return 'this command must be done in a server';
    }

    let message = input.message;
    let conf = this.getConfig('default');

    if (message.guild.id !== conf.server) {
      return 'this command is invalid on this server';
    }
    if (!message.channel.name.match(/support-\w+/)) {
      return 'this command is invalid in this channel';
    }

    let server = this.discord.guilds.get(conf.server);

    if (!server.available) {
      return 'error communicating with Discord. not sure how this message got through';
    }

    let id = message.channel.name;
    let role = message.guild.roles.find('name', id);
    if (!role) {
      return 'unable to find role, requesting manual action';
    }

    setTimeout(() => {
      message.channel.delete();
      role.delete();
    }, 10000);

    let embed = new Discord.RichEmbed()
      .setTitle('All done!')
      .setDescription('this channel will self-destruct in 10 seconds');

    this.bot.send(message.channel, embed);

    return '';
  }
}

module.exports = Support;
