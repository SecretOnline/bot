import Thing from '../interfaces/Thing';
import ITargetable from '../interfaces/ITargetable';
import Connection from './Connection';
import Server from './Server';
import ISendable from '../interfaces/ISendable';

export default abstract class Channel implements Thing, ITargetable {
  readonly abstract name: string;
  readonly abstract id: string;
  readonly abstract server: Server;
  readonly abstract connection: Connection = this.server.connection;
  readonly abstract raw: any;

  send(msg: ISendable) {
    return this.connection.send(this, msg);
  }
}
