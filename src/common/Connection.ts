import { EventEmitter } from 'events';

import IObjectMap from '../interfaces/IObjectMap';
import Thing from '../interfaces/Thing';
import ITargetable from '../interfaces/ITargetable';
import IConnectionEvents from '../interfaces/IConnectionEvents';
import ISendable from '../interfaces/ISendable';
import Bot from '../bot/Bot';
import Message from './Message';
import User from './User';
import Channel from './Channel';
import { CommandPermission } from './Command';

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
   * Configuration for this connection
   *
   * @private
   * @type {IObjectMap<any>}
   * @memberof Connection
   */
  abstract conf: IObjectMap<any>;

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
   * @param {ConnectionConfig} config Configutation for the connection
   * @returns {Promise<boolean>}
   * @memberof Connection
   */
  start(config: IConnectionConfig): Promise<boolean> {
    this.conf = config;

    return Promise.resolve(true);
  }

  /**
   * Stops the connection
   *
   * @returns {Promise<void>}
   * @memberof Connection
   */
  stop(): Promise<void> {
    return Promise.resolve();
  }

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

  /**
   * Gets the permission level for a user
   *
   * @abstract
   * @param {User} user User to get permission of
   * @param {Channel} context Channel context of the user
   * @returns {CommandPermission}
   * @memberof Connection
   */
  abstract getPermissionLevel(user: User, context: Channel): CommandPermission;
}
