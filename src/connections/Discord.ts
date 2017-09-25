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

    });
  }

  start(conf: ConnectionConfig) {
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
  readonly connection: DiscordJs;
  readonly id: string;
  readonly name: string;
  readonly server: DiscordServer;
  readonly raw: TextChannel;

  constructor(connection: DiscordJs, server: DiscordServer, channel: TextChannel) {
    super();

    this.raw = channel;

    this.connection = connection;
    this.id = this.raw.id;
    this.name = this.raw.name;
    this.server = server;
  }
}

export class DiscordServer extends Server {
  readonly connection: DiscordJs;
  readonly id: string;
  readonly name: string;
  readonly raw: Guild;

  constructor(connection: DiscordJs, server: Guild) {
    super();

    this.raw = server;

    this.connection = connection;
    this.id = this.raw.id;
    this.name = this.raw.name;
  }
}

export class DiscordUser extends User {
  readonly name: string;
  readonly id: string;
  readonly connection: DiscordJs;
  readonly raw: DjsUser;

  constructor(connection: DiscordJs, user: DjsUser) {
    super();

    this.raw = user;

    this.connection = connection;
    this.id = this.raw.id;
    this.name = this.raw.username;
  }
}

export class DiscordMessage extends Message {
  readonly text: string;
  readonly id: string;
  readonly connection: DiscordJs;
  readonly user: DiscordUser;
  readonly channel?: DiscordChannel;
  readonly server: DiscordServer;
  readonly raw: DjsMessage;

  constructor(connection: DiscordJs, user: DiscordUser, channel: DiscordChannel, message: DjsMessage) {
    super();

    this.raw = message;

    this.connection = connection;
    this.text = this.raw.content;
    this.id = this.raw.id;
    this.user = user;
    this.channel = channel;
    this.server = this.channel ? this.channel.server : null;
    this.raw = this.raw;
  }
}
