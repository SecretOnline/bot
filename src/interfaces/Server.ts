import Thing from './Thing';
import Connection from './Connection';

export default interface Server extends Thing {
  connection: Connection,
  raw: any,
}
