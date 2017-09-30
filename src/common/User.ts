import Thing from '../interfaces/Thing';
import ITargetable from '../interfaces/ITargetable';
import ISendable from '../interfaces/ISendable';
import IObjectMap from '../interfaces/IObjectMap';
import { IAddonConfig } from './Addon';
import Connection from './Connection';

export interface IUserConfig extends IObjectMap<any> {
  name: string;
  'addon-conf': {
    [x: string]: IAddonConfig;
  };
}

/**
 * Base class for a User
 *
 * @abstract
 * @class User
 * @export
 * @implements {Thing}
 * @implements {ITargetable}
 */
export default abstract class User implements Thing, ITargetable {
  /**
   * Name of the user
   *
   * @type {string}
   * @memberof User
   */
  readonly name: string;

  /**
   * ID of the user
   *
   * @type {string}
   * @memberof User
   */
  readonly id: string;

  /**
   * Connection the user uses
   *
   * @type {Connection}
   * @memberof User
   */
  readonly connection: Connection;

  /**
   * Whether the user is a bot
   *
   * @type {boolean}
   * @memberof User
   */
  readonly isBot: boolean;

  /**
   * @type {*}
   * @memberof User
   */
  readonly raw: any;

  /**
   * Creates an instance of User.
   * @param {string} name Name of the user
   * @param {string} id ID of the user
   * @param {Connection} connection Connection the user uses
   * @param {boolean} [isBot=false] Whether user is a bot
   * @param {*} raw
   * @memberof User
   */
  constructor(name: string, id: string, connection: Connection, isBot = false, raw: any) {
    this.name = name;
    this.id = `${connection.id}@${id}`;
    this.connection = connection;
    this.isBot = isBot;
    this.raw = raw;
  }

  /**
   * Sends a message to the user
   *
   * @param {ISendable} msg Message to send
   * @returns {Promise<Message>}
   * @memberof User
   */
  send(msg: ISendable) {
    return this.connection.send(this, msg);
  }
}
