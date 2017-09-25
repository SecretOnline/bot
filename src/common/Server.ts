import Thing from '../interfaces/Thing';
import Connection from './Connection';

export default abstract class Server implements Thing {
  readonly name: string;
  readonly id: string;
  readonly connection: Connection;
  readonly raw: any;
}
