import {
  Client,
  TextChannel,
  Guild,
  User as DjsUser,
  Message as DjsMessage,
  RichEmbed,
} from 'discord.js';

import ITargetable from '../interfaces/ITargetable';

import Connection, { IConnectionConfig } from '../common/Connection';
import Channel from '../common/Channel';
import Server from '../common/Server';
import Message from '../common/Message';
import User from '../common/User';
import ISendable from '../interfaces/ISendable';
import IColorMap from '../interfaces/IColorMap';
import Bot from '../bot/Bot';

import TextSendable from '../sendables/TextSendable';
import CompoundSendable from '../sendables/CompoundSendable';
import ErrorSendable from '../sendables/ErrorSendable';

import {
  MessageNotSentError,
  InvalidTargetError,
} from '../errors/ConnectionError';

/**
 * Configuration for the Discord connection
 *
 * @interface DiscordConfig
 * @extends {ConnectionConfig}
 */
interface DiscordConfig extends IConnectionConfig {
  token: string;
}

/**
 * Turns a string into a RichEmbed by making it the description
 *
 * @param {string} str String to embed
 * @param {string} [color] Color to set the embed to
 * @returns
 */
function embedify(sendable: ISendable, colorMap: IColorMap): (RichEmbed | RichEmbed[]) {
  const embed = new RichEmbed()
    .setColor(colorMap.normal);

  if (sendable instanceof TextSendable) {
    // See if message is a link
    // Basic url matching regex
    const urlRegex = /(https?:\/\/(?:\w+\.?)+\/?\S*\.(?:jpe?g|png|gif(?!v)))/g;
    const match = sendable.text.match(urlRegex);
    if (match) {
      // Use last image in message
      const last = match[match.length - 1];
      embed.setImage(last);

      // If the message more than just that link, put entire message in description
      if (sendable.text !== last) {
        // If only message, remove the link
        if (match.length === 1) {
          embed.setDescription(sendable.text.replace(match[0], ''));
        } else {
          embed.setDescription(sendable.text);
        }
      }
    } else {
      embed.setDescription(sendable.text);
    }
  } else if (sendable instanceof ErrorSendable) {
    embed
      .setColor(colorMap.error)
      .setDescription(sendable.error.message)
      .setTitle(sendable.error.name);
  } else if (sendable instanceof CompoundSendable) {
    // As there are potentially multiple sendables, must return an array
    return [
      new TextSendable(sendable.text),
      ...sendable.extras,
    ]
      .map((s): RichEmbed => {
        const e = embedify(s, colorMap);
        // Throw away any internal CompundSendables
        // They shouldn't be in there anyway
        if (Array.isArray(e)) {
          return null;
        }
        return e;
      })
      .filter(e => e);
  }

  return embed;
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

  conf: DiscordConfig;

  private client: Client = new Client();

  private userMap = new Map<string, DiscordUser>();
  private channelMap = new Map<string, DiscordChannel>();
  private serverMap = new Map<string, DiscordServer>();

  /**
   * Creates an instance of DiscordJs.
   * @memberof DiscordJs
   */
  constructor(bot: Bot) {
    super(bot);

    this.client.on('message', (msg) => {
      if (msg.author.id === this.client.user.id) {
        return;
      }

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
  async start(conf: DiscordConfig) {
    await super.start(conf);

    await this.client.login(conf.token);

    return true;
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
  async send(target: ITargetable, msg: ISendable) {
    if (target instanceof DiscordChannel || target instanceof DiscordUser) {
      let embeds = embedify(msg, this.bot.getColorMap(target));
      if (!Array.isArray(embeds)) {
        embeds = [embeds];
      }

      const fns = embeds
        .map(embed => () => target.raw.send('', { embed }));

      let sentMessage: DjsMessage | DjsMessage[];
      for (let i = 0; i < fns.length; i += 1) {
        try {
          const res = await fns[i]();
          if (!sentMessage) {
            sentMessage = res;
          }
        } catch (error) {
          console.error(error);
        }
      }

      if (!sentMessage) {
        console.error('wasn\'t able to send message');
      }

      if (Array.isArray(sentMessage)) {
        if (sentMessage.length === 0) {
          throw new MessageNotSentError();
        }
        sentMessage = sentMessage[0];
      }

      return this.djsToBotMessage(sentMessage);
    } else {
      throw new InvalidTargetError(target);
    }
  }

    /**
   * Gets the permission level for a user
   *
   * @param {User} user User to get permission of
   * @param {Channel} context Channel context of the user
   * @returns {CommandPermission}
   * @memberof DiscordJs
   */
  getPermissionLevel(user: DiscordUser, context: DiscordChannel) {
    if (!context) {
      return 'DEFAULT';
    }

    const channel = context.raw;

    // DM channels always have default perms, even for overlords
    if (!(context instanceof TextChannel)) {
      return 'DEFAULT';
    }

    if (this.conf.overlords) {
      if (this.conf.overlords.includes(user.id)) {
        return 'OVERLORD';
      }
    }

    const perms = channel.permissionsFor(user.raw);
    if (perms && perms.hasPermission('MANAGE_GUILD')) {
      return 'ADMIN';
    }

    return 'DEFAULT';
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
      const server = this.serverMap.get(message.guild.id);

      if (!this.channelMap.has(message.channel.id)) {
        this.channelMap.set(message.channel.id, new DiscordChannel(this, server, message.channel));
      }
      channel = this.channelMap.get(message.channel.id);
    }

    // Get or create user object
    if (!this.userMap.has(message.author.id)) {
      this.userMap.set(message.author.id, new DiscordUser(this, message.author));
    }
    const user = this.userMap.get(message.author.id);

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
  raw: TextChannel;

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
  raw: Guild;

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
  raw: DjsUser;

  /**
   * Creates an instance of DiscordUser.
   * @param {DiscordJs} connection Discord connection
   * @param {DjsUser} user discord.js User
   * @memberof DiscordUser
   */
  constructor(connection: DiscordJs, user: DjsUser) {
    super(user.username, user.id, connection, user.bot, user);
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
  raw: DjsMessage;

  /**
   * Creates an instance of DiscordMessage.
   * @param {DiscordJs} connection Discord connection
   * @param {DiscordUser} user Discord user
   * @param {DiscordChannel} channel Discord channel
   * @param {DjsMessage} message discord.js Message
   * @memberof DiscordMessage
   */
  constructor(
    connection: DiscordJs,
    user: DiscordUser,
    channel: DiscordChannel,
    message: DjsMessage,
  ) {
    super(message.content, message.id, channel, user, connection, message);
  }
}
