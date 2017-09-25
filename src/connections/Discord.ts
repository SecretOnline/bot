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
import Sendable from '../common/Sendable';


export default class DiscordJs extends Connection {

}

export class DiscordChannel extends Channel {
  private channel: TextChannel;

  readonly connection;
  readonly id;
  readonly name;
  readonly server;
  readonly raw;

  constructor(connection: DiscordJs, server: DiscordServer, channel: TextChannel) {
    super();

    this.channel = channel;

    this.connection = connection;
    this.id = this.channel.id;
    this.name = this.channel.name;
    this.server = server;
    this.raw = this.channel;
  }
}

export class DiscordServer extends Server {
  private server: Guild;

  readonly connection;
  readonly id;
  readonly name;
  readonly raw;

  constructor(connection: DiscordJs, server: Guild) {
    super();

    this.server = server;

    this.connection = connection;
    this.id = this.server.id;
    this.name = this.server.name;
    this.raw = this.server;
  }
}

export class DiscordUser extends User {
  private user: DjsUser;

  readonly name;
  readonly id;
  readonly connection;
  readonly raw;

  constructor(connection: DiscordJs, user: DjsUser) {
    super();

    this.user = user;

    this.connection = connection;
    this.id = this.user.id;
    this.name = this.user.username;
    this.raw = this.user;
  }
}

export class DiscordMessage extends Message {
  private message: DjsMessage;

  readonly text;
  readonly id;
  readonly connection;
  readonly user;
  readonly channel;
  readonly server;
  readonly raw;

  constructor(connection: DiscordJs, user: DiscordUser, channel: DiscordChannel, message: DjsMessage) {
    super();

    this.message = message;

    this.connection = connection;
    this.text = this.message.content;
    this.id = this.message.id;
    this.user = user;
    this.channel = channel;
    this.server = this.channel ? this.channel.server : null;
    this.raw = this.message;
  }
}
