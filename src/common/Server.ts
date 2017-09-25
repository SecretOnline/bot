import Thing from '../interfaces/Thing';
import Connection from './Connection';

export default abstract class Server implements Thing {
  readonly abstract name: string;
  readonly abstract id: string;
  readonly abstract connection: Connection;
  readonly abstract raw: any;
}
