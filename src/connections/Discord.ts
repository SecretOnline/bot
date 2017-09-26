import {
  Client,
  TextChannel,
  Guild,
  User as DjsUser,
  Message as DjsMessage,
} from 'discord.js';

import ITargetable from '../interfaces/ITargetable';

import Connection, { IConnectionConfig } from '../common/Connection';
import Channel from '../common/Channel';
import Server from '../common/Server';
import Message from '../common/Message';
import User from '../common/User';
import ISendable from '../interfaces/ISendable';

/**
 * Configuration for the Discord connection
 *
 * @interface DiscordConfig
 * @extends {ConnectionConfig}
 */
interface DiscordConfig extends IConnectionConfig {
  token: string,
}

/**
 * A connection to Discord
 *
 * @export
 * @class DiscordJs
 * @extends {Connection}
 */
export default class DiscordJs extends Connection {
  readonly name = 'Discord';
  readonly id = 'djs';

  private client: Client = new Client();

  private userMap = new Map<string, DiscordUser>();
  private channelMap = new Map<string, DiscordChannel>();
  private serverMap = new Map<string, DiscordServer>();

  /**
   * Creates an instance of DiscordJs.
   * @memberof DiscordJs
   */
  constructor() {
    super();

    this.client.on('message', (msg) => {
      this.emit('message', this.djsToBotMessage(msg));
    });
  }

  /**
   * Starts the Discord connection
   *
   * @param {DiscordConfig} conf Configuration
   * @returns {Promise<boolean>}
   * @memberof DiscordJs
   */
  start(conf: DiscordConfig) {
    return this.client
      .login(conf.token)
      .then(() => true);
  }

  /**
   * Stops the Discord connection
   *
   * @returns {Promise<void>}
   * @memberof DiscordJs
   */
  stop() {
    return this.client.destroy();
  }

  /**
   * Sends a message to the target
   *
   * @param {ITargetable} target Target to send to
   * @param {ISendable} msg Message to send
   * @returns {Promise<Message>}
   * @memberof DiscordJs
   */
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

  /**
   * Converts a Discord message to a Bot-ready one
   *
   * @param {DjsMessage} message Discord message to convert
   * @returns {Message}
   * @memberof DiscordJs
   */
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

/**
 * A Discord channel
 *
 * @export
 * @class DiscordChannel
 * @extends {Channel}
 */
export class DiscordChannel extends Channel {
  /**
   * Creates an instance of DiscordChannel.
   * @param {DiscordJs} connection Discord connection
   * @param {DiscordServer} server Discord server
   * @param {TextChannel} channel discord.js TextChannel
   * @memberof DiscordChannel
   */
  constructor(connection: DiscordJs, server: DiscordServer, channel: TextChannel) {
    super(channel.name, channel.id, server, connection, channel);
  }
}

/**
 * A Discord server
 *
 * @export
 * @class DiscordServer
 * @extends {Server}
 */
export class DiscordServer extends Server {
  /**
   * Creates an instance of DiscordServer.
   * @param {DiscordJs} connection Discord connection
   * @param {Guild} server discord.js Guild
   * @memberof DiscordServer
   */
  constructor(connection: DiscordJs, server: Guild) {
    super(server.name, server.id, connection, server);
  }
}

/**
 * A Discord user
 *
 * @export
 * @class DiscordUser
 * @extends {User}
 */
export class DiscordUser extends User {
  /**
   * Creates an instance of DiscordUser.
   * @param {DiscordJs} connection Discord connection
   * @param {DjsUser} user discord.js User
   * @memberof DiscordUser
   */
  constructor(connection: DiscordJs, user: DjsUser) {
    super(user.username, user.id, connection, user);
  }
}

/**
 * A Discord message
 *
 * @export
 * @class DiscordMessage
 * @extends {Message}
 */
export class DiscordMessage extends Message {
  /**
   * Creates an instance of DiscordMessage.
   * @param {DiscordJs} connection Discord connection
   * @param {DiscordUser} user Discord user
   * @param {DiscordChannel} channel Discord channel
   * @param {DjsMessage} message discord.js Message
   * @memberof DiscordMessage
   */
  constructor(connection: DiscordJs, user: DiscordUser, channel: DiscordChannel, message: DjsMessage) {
    super(message.content, message.id, channel, user, connection, message);
  }
}
