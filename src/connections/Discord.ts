import {
  Client,
  TextChannel,
  Guild,
  User as DjsUser,
  Message as DjsMessage,
  RichEmbed,
} from 'discord.js';

import ITargetable from '../interfaces/ITargetable';

import Connection, {
  IConnectionConfig,
  MentionCollection,
} from '../common/Connection';
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
import AnimationSendable from '../sendables/AnimationSendable';
import InfoSendable from '../sendables/InfoSendable';
import SectionedSendable from '../sendables/SectionedSendable';

import {
  MessageNotSentError,
  InvalidTargetError,
  InvalidIDError,
  UnknownIDError,
} from '../errors/ConnectionError';
import WrapperError from '../errors/WrapperError';

import {
  promiseChain,
  delay,
} from '../util';
import RichSendable from '../sendables/RichSendable';

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
async function embedify(sendable: ISendable, colorMap: IColorMap) {
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
  } else if (sendable instanceof RichSendable) {
    if (sendable.description) {
      embed.setDescription(sendable.description);
    }
    if (sendable.title) {
      embed.setTitle(sendable.title);
    }
    if (sendable.url) {
      embed.setURL(sendable.url);
    }
    if (sendable.thumbUrl) {
      embed.setThumbnail(sendable.thumbUrl);
    }
    if (sendable.color) {
      embed.setColor(sendable.color);
    }
    if (sendable.authorName || sendable.authorThumb || sendable.authorUrl) {
      embed.setAuthor(sendable.authorName, sendable.authorThumb, sendable.authorUrl);
    }
    sendable.sections.forEach((section) => {
      embed.addField(
        section.title || '\u200b',
        section.text || '\u200b',
        section.inline);
    });
  } else if (sendable instanceof AnimationSendable) {
    const frame = await sendable.frames[0];
    embed.setDescription(frame.text);
  } else {
    embed.setDescription(sendable.text);
  }

  return embed;
}

function playAnimation(msg: DjsMessage, anim: AnimationSendable, colorMap: IColorMap) {
  const editFns = anim.frames.map((frame) => {
    return () => {
      const editProm = frame
        .then(f => embedify(f, colorMap))
        .then(embed => msg.edit('', { embed }));

      return Promise.all([
        editProm,
        delay(anim.delay),
      ]);
    };
  });

  return promiseChain(editFns);
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

    this.client.on('message', (msg) => {
      if (msg.author.id === this.client.user.id) {
        return;
      }

      this.emit('message', this.createMessage(msg));
    });

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
      let sendables = [msg];
      if (msg instanceof CompoundSendable) {
        sendables = [
          ...msg.extras,
          new TextSendable(msg.text),
        ];
      }

      const colorMap = this.bot.getColorMap(target);
      let embeds = await Promise.all(sendables.map(s => embedify(s, colorMap)));
      if (!Array.isArray(embeds)) {
        embeds = [embeds];
      }

      const fns = embeds
        .map(embed => () => target.raw.send('', { embed }));

      let sentMessage: DjsMessage;
      for (let i = 0; i < fns.length; i += 1) {
        try {
          let res = await fns[i]();
          if (Array.isArray(res)) {
            res = res[0];
          }

          const s = sendables[i];
          if (s instanceof AnimationSendable) {
            playAnimation(res, s, colorMap);
          }

          if (!sentMessage) {
            sentMessage = res;
          }
        } catch (error) {
          this.log(new WrapperError(error));
        }
      }

      if (!sentMessage) {
        this.log('wasn\'t able to send message');
      }

      if (Array.isArray(sentMessage)) {
        if (sentMessage.length === 0) {
          throw new MessageNotSentError();
        }
        sentMessage = sentMessage[0];
      }

      return this.createMessage(sentMessage);
    }

    throw new InvalidTargetError(target);
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
    if (!(channel instanceof TextChannel)) {
      return 'DEFAULT';
    }

    if (this.conf.overlords) {
      if (this.conf.overlords.includes(user.id)) {
        return 'OVERLORD';
      }
    }

    const perms = channel.permissionsFor(user.raw);
    if (perms && perms.has('MANAGE_GUILD')) {
      return 'ADMIN';
    }

    return 'DEFAULT';
  }

  /**
   * Gets the server with the given ID
   *
   * @abstract
   * @param {string} id ID of server to get
   * @returns {Server}
   * @memberof DiscordJs
   */
  getServerFromId(id: string) {
    // Ensure this is a server
    const match = id.match(new RegExp(`${this.id}\\$(\\d+)$`));
    if (!match) {
      throw new InvalidIDError(id);
    }
    const serverId = match[1];

    // If server exists in connection, return it
    if (this.serverMap.has(serverId)) {
      return this.serverMap.get(serverId);
    }

    // If server is in client, create a Server and return it
    if (this.client.guilds.has(serverId)) {
      const server = this.createServer(this.client.guilds.get(serverId));
      this.serverMap.set(server.id, server);
      return server;
    }

    // Unable to create server
    throw new UnknownIDError(id);
  }

  /**
   * Gets the channel with the given ID
   *
   * @abstract
   * @param {string} id ID of the channel to get
   * @returns {Channel}
   * @memberof DiscordJs
   */
  getChannelFromId(id: string) {
    // Ensure this is a channel
    const match = id.match(new RegExp(`${this.id}$\\d+#(\\d+)$`));
    if (!match) {
      throw new InvalidIDError(id);
    }
    const channelId = match[1];

    // If channel exists in connection, return it
    if (this.channelMap.has(channelId)) {
      return this.channelMap.get(channelId);
    }

    // If channel is in client, create a Channel and return it
    if (this.client.guilds.has(channelId)) {
      const djsChannel = this.client.channels.get(channelId);
      // On the off-chance that a bad ID ended up in here somehow, throw when not a text channel
      if (!(djsChannel instanceof TextChannel)) {
        throw new UnknownIDError(id);
      }
      const channel = this.createChannel(djsChannel);
      this.channelMap.set(channel.id, channel);
      return channel;
    }

    // Unable to create channel
    throw new UnknownIDError(id);
  }

  /**
   * Gets the user with the given ID
   *
   * @abstract
   * @param {string} id ID of the user to get
   * @returns {User}
   * @memberof DiscordJs
   */
  getUserFromId(id: string) {
    // Ensure this is a user
    const match = id.match(new RegExp(`${this.id}@(\\d+)$`));
    if (!match) {
      throw new InvalidIDError(id);
    }
    const userId = match[1];

    // If user exists in connection, return it
    if (this.userMap.has(userId)) {
      return this.userMap.get(userId);
    }

    // If user is in client, create a user and return it
    if (this.client.guilds.has(userId)) {
      const djsUser = this.client.users.get(userId);
      const user = this.createUser(djsUser);
      this.userMap.set(user.id, user);
      return user;
    }

    // Unable to create user
    throw new UnknownIDError(id);
  }

  resolveMentions(message: Message): MentionCollection {
    if (!(message instanceof DiscordMessage)) {
      return {
        users: [],
        channels: [],
        servers: [],
      };
    }

    const users = message.raw.mentions.users
      .map((user) => {
        if (!this.userMap.has(user.id)) {
          this.userMap.set(user.id, this.createUser(user));
        }

        return this.userMap.get(user.id);
      });

    const channels = message.raw.mentions.channels
      .map((channel) => {
        if (!this.channelMap.has(channel.id)) {
          this.channelMap.set(channel.id, this.createChannel(channel));
        }

        return this.channelMap.get(channel.id);
      });

    return {
      users,
      channels,
      servers: [],
    };
  }

  /**
   * Converts a Discord message to a Bot-ready one
   *
   * @param {DjsMessage} message Discord message to convert
   * @returns {Message}
   * @memberof DiscordJs
   */
  createMessage(message: DjsMessage) {
    let channel = null;

    // Get or create channel/server objects for this message
    // Only applicable if this is a guild message
    if (message.channel instanceof TextChannel) {
      if (!this.channelMap.has(message.channel.id)) {
        this.channelMap.set(message.channel.id, this.createChannel(message.channel));
      }
      channel = this.channelMap.get(message.channel.id);
    }

    // Get or create user object
    if (!this.userMap.has(message.author.id)) {
      this.userMap.set(message.author.id, this.createUser(message.author));
    }
    const user = this.userMap.get(message.author.id);

    // Create new DiscordMessage
    return new DiscordMessage(this, user, channel, message);
  }

  createServer(guild: Guild) {
    return new DiscordServer(this, guild);
  }

  createChannel(channel: TextChannel) {
    if (!this.serverMap.has(channel.guild.id)) {
      this.serverMap.set(channel.guild.id, this.createServer(channel.guild));
    }
    const server = this.serverMap.get(channel.guild.id);

    return new DiscordChannel(this, server, channel);
  }

  createUser(user: DjsUser) {
    return new DiscordUser(this, user);
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
