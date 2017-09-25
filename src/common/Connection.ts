import { EventEmitter } from 'events';

import Thing from '../interfaces/Thing';
import ITargetable from '../interfaces/ITargetable';
import IConnectionEvents from '../interfaces/IConnectionEvents';
import ISendable from '../interfaces/ISendable';
import Message from './Message';

export interface ConnectionConfig {
  [x: string]: any,
}

export default abstract class Connection extends EventEmitter implements Thing, IConnectionEvents {
  readonly abstract name: string;
  readonly abstract id: string;

  abstract start(config: ConnectionConfig): Promise<boolean>;
  abstract stop(): Promise<void>;

  abstract send(target: ITargetable, msg: ISendable): Promise<Message>;
}
