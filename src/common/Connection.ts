import { EventEmitter } from 'events';

import Thing from '../interfaces/Thing';
import ITargetable from '../interfaces/ITargetable';
import Sendable from './Sendable';
import Message from './Message';

export interface ConnectionConfig {
  [x: string]: any,
}

export default abstract class Connection extends EventEmitter implements Thing {
  readonly abstract name: string;
  readonly abstract id: string;

  abstract start(config: ConnectionConfig): Promise<boolean>;
  abstract stop(): Promise<void>;

  abstract on(event: 'message', listener: (msg: Message) => void): this;

  abstract send(target: ITargetable, msg: Sendable): Promise<Message>;
}
