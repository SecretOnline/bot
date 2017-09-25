import Thing from '../interfaces/Thing';
import Connection from './Connection';
import Server from './Server';
import Channel from './Channel';
import User from './User';

export default abstract class Message implements Thing {
  readonly name: string;
  readonly id: string;
  readonly connection: Connection
  readonly server: Server
  readonly channel: Channel
  readonly user: User
  readonly raw: any
}
