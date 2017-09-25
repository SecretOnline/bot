import Thing from '../interfaces/Thing';
import ITargetable from '../interfaces/ITargetable';
import Connection from './Connection';
import Server from './Server';
import Sendable from './Sendable';

export default abstract class Channel implements Thing, ITargetable {
  readonly name: string;
  readonly id: string;
  readonly connection: Connection
  readonly server: Server
  readonly raw: any

  send(msg: Sendable) {
    return this.connection.send(this, msg);
  }
}
