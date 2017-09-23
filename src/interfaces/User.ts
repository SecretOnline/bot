import Thing from './Thing';
import Connection from './Connection';
import Targetable from './Targetable';

export default interface User extends Thing, Targetable {
  connection: Connection,
  raw: any,
}
