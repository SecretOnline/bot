import { EventEmitter } from 'events';

import IObjectMap from '../interfaces/IObjectMap';
import Thing from '../interfaces/Thing';
import ITargetable from '../interfaces/ITargetable';
import IConnectionEvents from '../interfaces/IConnectionEvents';
import ISendable from '../interfaces/ISendable';
import Message from './Message';

/**
 * Base interface for connection configuration
 *
 * @export
 * @interface ConnectionConfig
 */
export interface ConnectionConfig extends IObjectMap<any> {}

/**
 * Base class for a connection
 *
 * @abstract
 * @class Connection
 * @export
 * @extends {EventEmitter}
 * @implements {Thing}
 * @implements {IConnectionEvents}
 */
export default abstract class Connection extends EventEmitter implements Thing, IConnectionEvents {
  /**
   * Name of the Connection
   *
   * @abstract
   * @type {string}
   * @memberof Connection
   */
  readonly abstract name: string;

  /**
   * ID of the connection
   *
   * @abstract
   * @type {string}
   * @memberof Connection
   */
  readonly abstract id: string;

  /**
   * Starts the connection
   *
   * @abstract
   * @param {ConnectionConfig} config Configutation for the connection
   * @returns {Promise<boolean>}
   * @memberof Connection
   */
  abstract start(config: ConnectionConfig): Promise<boolean>;

  /**
   * Stops the connection
   *
   * @abstract
   * @returns {Promise<void>}
   * @memberof Connection
   */
  abstract stop(): Promise<void>;

  /**
   * Sends a message to the target
   *
   * @abstract
   * @param {ITargetable} target Target to send to
   * @param {ISendable} msg Message to send
   * @returns {Promise<Message>}
   * @memberof Connection
   */
  abstract send(target: ITargetable, msg: ISendable): Promise<Message>;
}
