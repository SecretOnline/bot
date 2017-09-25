import {
  Client,
  TextChannel,
  Guild,
  User as DjsUser,
  Message as DjsMessage,
} from 'discord.js';

import ITargetable from '../interfaces/ITargetable';

import Connection, { ConnectionConfig } from '../common/Connection';
import Channel from '../common/Channel';
import Server from '../common/Server';
import Message from '../common/Message';
import User from '../common/User';
import ISendable from '../interfaces/ISendable';

interface DiscordConfig extends ConnectionConfig {
  token: string,
}

export default class DiscordJs extends Connection {
  readonly name = 'Discord';
  readonly id = 'djs';

  private client: Client = new Client();

  private userMap = new Map<string, DiscordUser>();
  private channelMap = new Map<string, DiscordChannel>();
  private serverMap = new Map<string, DiscordServer>();

  constructor() {
    super();

    this.client.on('message', (msg) => {
      this.emit('message', this.djsToBotMessage(msg));
    });
  }

  start(conf: DiscordConfig) {
    return this.client
      .login(conf.token)
      .then(() => true);
  }

  stop() {
    return this.client.destroy();
  }

  send(target: ITargetable, msg: ISendable) {
    if (target instanceof DiscordChannel || target instanceof DiscordUser) {
      // TODO: Better sending
      target.raw.send(msg.text, null)
        .then((msg) => {
          if (Array.isArray(msg)) {
            if (msg.length === 0) {
              throw 'no received message';
            }
            return msg[0];
          } else {
            return msg;
          }
        })
        .then((msg) => this.djsToBotMessage(msg));
    } else {
      return Promise.reject('can not send message to non-discord target');
    }
  }

  djsToBotMessage(message: DjsMessage) {
    let channel = null;

    // Get or create channel/server objects for this message
    // Only applicable if this is a guild message
    if (message.channel instanceof TextChannel) {
      if (!this.serverMap.has(message.guild.id)) {
        this.serverMap.set(message.guild.id, new DiscordServer(this, message.guild));
      }
      let server = this.serverMap.get(message.guild.id);

      if (!this.channelMap.has(message.channel.id)) {
        this.channelMap.set(message.channel.id, new DiscordChannel(this, server, message.channel));
      }
      channel = this.channelMap.get(message.channel.id);
    }

    // Get or create user object
    if (!this.userMap.has(message.author.id)) {
      this.userMap.set(message.author.id, new DiscordUser(this, message.author));
    }
    let user = this.userMap.get(message.author.id);

    // Create new DiscordMessage
    return new DiscordMessage(this, user, channel, message);
  }
}

export class DiscordChannel extends Channel {
  constructor(connection: DiscordJs, server: DiscordServer, channel: TextChannel) {
    super(channel.name, channel.id, server, connection, channel);
  }
}

export class DiscordServer extends Server {
  constructor(connection: DiscordJs, server: Guild) {
    super(server.name, server.id, connection, server);
  }
}

export class DiscordUser extends User {
  constructor(connection: DiscordJs, user: DjsUser) {
    super(user.username, user.id, connection, user);
  }
}

export class DiscordMessage extends Message {
  constructor(connection: DiscordJs, user: DiscordUser, channel: DiscordChannel, message: DjsMessage) {
    super(message.content, message.id, channel, user, connection, message);
  }
}
