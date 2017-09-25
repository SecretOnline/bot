import Thing from '../interfaces/Thing';
import ITargetable from '../interfaces/ITargetable';
import ISendable from '../interfaces/ISendable';
import Connection from './Connection';

export default abstract class User implements Thing, ITargetable {
  readonly name: string;
  readonly id: string;
  readonly connection: Connection;
  readonly raw: any;

  constructor(name: string, id: string, connection: Connection, raw: any) {
    this.name = name;
    this.id = id;
    this.connection = connection;
    this.raw = raw;
  }

  send(msg: ISendable) {
    return this.connection.send(this, msg);
  }
}
