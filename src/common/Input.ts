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
    if (this.argsArray) {
      return this.argsArray.slice();
    } else {
      this.argsArray = quoteSplit(this.text);
    }
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

  from(sendable: ISendable) {
    return new Input(this.message, sendable.text);
  }
}
