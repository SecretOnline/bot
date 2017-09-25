import Thing from '../interfaces/Thing';
import ITargetable from '../interfaces/ITargetable';
import Sendable from './Sendable';
import Connection from './Connection';

export default abstract class User implements Thing, ITargetable {
  readonly name: string;
  readonly id: string;
  readonly connection: Connection;
  readonly raw: any;

  send(msg: Sendable) {
    return this.connection.send(this, msg);
  }
}
