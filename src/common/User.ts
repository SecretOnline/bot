import Thing from '../interfaces/Thing';
import ITargetable from '../interfaces/ITargetable';
import Sendable from './Sendable';
import Connection from './Connection';

export default abstract class User implements Thing, ITargetable {
  readonly abstract name: string;
  readonly abstract id: string;
  readonly abstract connection: Connection;
  readonly abstract raw: any;

  send(msg: Sendable) {
    return this.connection.send(this, msg);
  }
}
