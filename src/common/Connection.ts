import { EventEmitter } from 'events';

import IObjectMap from '../interfaces/IObjectMap';
import Thing from '../interfaces/Thing';
import ITargetable from '../interfaces/ITargetable';
import IConnectionEvents from '../interfaces/IConnectionEvents';
import ISendable from '../interfaces/ISendable';
import Bot from '../bot/Bot';
import Message from './Message';

/**
 * Base interface for connection configuration
 *
 * @export
 * @interface IConnectionConfig
 */
export interface IConnectionConfig extends IObjectMap<any> {}

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
   * Bot that created the Connection
   *
   * @type {Bot}
   * @memberof Connection
   */
  readonly bot: Bot;

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
   * Creates an instance of Connection.
   * @param {Bot} bot Bot that created the Connection
   * @memberof Connection
   */
  constructor(bot: Bot) {
    super();

    this.bot = bot;
  }

  /**
   * Starts the connection
   *
   * @abstract
   * @param {ConnectionConfig} config Configutation for the connection
   * @returns {Promise<boolean>}
   * @memberof Connection
   */
  abstract start(config: IConnectionConfig): Promise<boolean>;

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
