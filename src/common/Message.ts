import Thing from '../interfaces/Thing';
import Connection from './Connection';
import Server from './Server';
import Channel from './Channel';
import User from './User';

export default abstract class Message implements Thing {
  readonly text: string;
  readonly name: string;
  readonly id: string;
  readonly channel?: Channel;
  readonly server?: Server;
  readonly user: User;
  readonly connection: Connection;
  readonly raw: any;

  constructor(text: string, id: string, channel: Channel, user: User, connection: Connection, raw: any) {
    this.name = text;
    this.text = text;
    this.id = id;
    this.channel = channel;
    this.server = channel ? channel.server : null;
    this.user = user;
    this.connection = connection;
    this.raw = raw;
  }
}
