import Thing from './Thing';
import Connection from './Connection';
import Server from './Server';
import Channel from './Channel';
import User from './User';

export default interface Message extends Thing {
  connection: Connection,
  server: Server,
  channel: Channel,
  user: User,
  raw: any
}
