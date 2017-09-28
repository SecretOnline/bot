import ISendable from '../interfaces/ISendable';

import User from './User';
import Message from './Message';

import { quoteSplit } from '../util';

export default class Input {
  private argsArray: string[];

  readonly text: string;
  readonly message: Message;

  constructor(message: Message, text: string = message.text) {
    this.text = text;
    this.message = message;
  }

  get args() {
    if (!this.argsArray) {
      this.argsArray = quoteSplit(this.text);
    }

    return this.argsArray.slice();
  }

  get user() {
    return this.message.user;
  }

  get server() {
    return this.message.server;
  }

  get channel() {
    return this.message.channel;
  }

  get connection() {
    return this.message.connection;
  }

  getPermissionLevel() {
    return this.connection.getPermissionLevel(this.user, this.channel);
  }

  from(sendable: ISendable) {
    return new Input(this.message, sendable.text);
  }
}
