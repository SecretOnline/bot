const Discord = require('discord.js');
const Command = require('../bot/Command.js');
const Connection = require('../bot/Connection.js');
const Channel = require('../bot/Channel.js');
const Message = require('../bot/Message.js');
const User = require('../bot/User.js');
const Server = require('../bot/Server.js');

class DiscordJSPrivateConnection extends Connection {
  constructor(bot) {
    super(bot, 'discord.js', 'djs');

    this.d = new Discord.Client();

    if (!this.conf.pm) {
      throw new Error('No login details given to DM discord.js');
    }
  }

  get discord() {
    return this.d;
  }

  open() {
    this.server = new Server(this, 'PRIVATE', 'PRIVATE');

    this.discord.on('message', this._onMessage.bind(this));
    this.discord.once('ready', () => {
      console.log('[djsdm] sucessfully logged in'); // eslint-disable-line no-console
    });

    this.discord.login(this.conf.pm.email, this.conf.pm.pass);
  }

  close() {
    this.discord.off('message', this._onMessage.bind(this));
  }

  mention(target) {
    if (target instanceof User) {
      return `<@${target.id}>`;
    } else if (target instanceof Channel) {
      return `<#${target.id}>`;
    }
  }

  resolveMention(str) {
    let match = str.match(/^<(?:#|@)(\d+)>$/);
    if (!match) {
      return false;
    }

    if (this.userCache.has(match[1])) {
      return this.userCache.get(match[1]);
    } else if (this.channelCache.has(match[1])) {
      return this.channelCache.get(match[1]);
    }

    return false;
  }

  send(target, message) {
    let to;
    if (target instanceof User) {
      to = this.discord.users.find('id', target.id);
    } else if (target instanceof Channel) {
      to = this.discord.channels.find('id', target.id);
    }
    if (!to) {
      throw new Error('[djsdm] Unable to find target in caches');
    }

    return to.sendMessage(message);
  }

  getPermissionLevel(user, channel) {
    // DM channels always have default perms, even for overlords
    if (channel instanceof User) {
      return Command.PermissionLevels.DEFAULT;
    }

    if (this.conf.overlords) {
      if (this.conf.overlords.includes(user.id)) {
        return Command.PermissionLevels.OVERLORD;
      }
    }

    return Command.PermissionLevels.DEFAULT;
  }

  _onMessage(message) {
    // Find or create User
    let user = this.userCache.get(message.author.id);
    if (!user) {
      user = new User(this, message.author.username, message.author.id);
      this.userCache.set(user.id, user);
    }

    let channel;
    // Is a standard channel
    if (message.channel instanceof Discord.GroupDMChannel) {
      channel = this.channelCache.get(message.channel.id);
      if (!channel) {
        // Create channel now that we have the server
        let name = message.channel.recipients.map(a=>a.name).join(', ');
        channel = new Channel(this, this.server, name, message.channel.id);
        this.channelCache.set(channel.id, channel);
      }
    }
    // Message was a DM, do DM things
    else {
      message.author.sendMessage('This is a deprecated version of `secret_bot`. Please don\'t use it.');
      return;
    }

    let isBot = false;
    if (user.id === this.discord.user.id) {
      isBot = true;
    }

    let m = new Message(user, channel, message.content, isBot);
    this.emit('message', m);
  }
}

module.exports = DiscordJSPrivateConnection;
