import Thing from '../interfaces/Thing';
import Connection from './Connection';
import Server from './Server';
import Channel from './Channel';
import User from './User';

export default abstract class Message implements Thing {
  readonly abstract text: string;
  readonly name: string = this.text;

  readonly abstract id: string;
  readonly abstract channel?: Channel;
  readonly abstract server: Server = this.channel ? this.channel.server : null;
  readonly abstract connection: Connection;
  readonly abstract user: User;
  readonly abstract raw: any;
}
