import Thing from './Thing';
import Connection from './Connection';
import Server from './Server';
import Targetable from './Targetable';

export default interface Channel extends Thing, Targetable {
  connection: Connection,
  server: Server,
  raw: any,
}
