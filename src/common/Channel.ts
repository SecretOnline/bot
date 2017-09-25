import Thing from '../interfaces/Thing';
import ITargetable from '../interfaces/ITargetable';
import Connection from './Connection';
import Server from './Server';
import ISendable from '../interfaces/ISendable';

export default abstract class Channel implements Thing, ITargetable {
  readonly name: string;
  readonly id: string;
  readonly server: Server;
  readonly connection: Connection;
  readonly raw: any;

  constructor(name: string, id: string, server: Server, connection: Connection, raw: any) {
    this.name = name;
    this.id = id;
    this.server = server;
    this.connection = connection;
    this.raw = raw;
  }

  send(msg: ISendable) {
    return this.connection.send(this, msg);
  }
}
