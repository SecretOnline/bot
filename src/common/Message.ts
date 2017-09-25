import Thing from '../interfaces/Thing';
import Connection from './Connection';
import Server from './Server';
import Channel from './Channel';
import User from './User';

/**
 * Base class for a message
 *
 * @abstract
 * @class Message
 * @export
 * @implements {Thing}
 */
export default abstract class Message implements Thing {
  /**
   * Text of the message
   *
   * @type {string}
   * @memberof Message
   */
  readonly text: string;

  /**
   * DEPRECATED: USE Message#text INSTEAD
   *
   * @deprecated
   * @type {string}
   * @memberof Message
   */
  readonly name: string;

  /**
   * ID of the message
   *
   * @type {string}
   * @memberof Message
   */
  readonly id: string;

  /**
   * Channel the message is in
   *
   * @type {Channel}
   * @memberof Message
   */
  readonly channel?: Channel;

  /**
   * Server the message is in
   *
   * @type {Server}
   * @memberof Message
   */
  readonly server?: Server;

  /**
   * Author of the message
   *
   * @type {User}
   * @memberof Message
   */
  readonly user: User;

  /**
   * Connection the message uses
   *
   * @type {Connection}
   * @memberof Message
   */
  readonly connection: Connection;

  /**
   * @type {*}
   * @memberof Message
   */
  readonly raw: any;

  /**
   * Creates an instance of Message.
   * @param {string} text Text of the message
   * @param {string} id ID of the message
   * @param {Channel} channel Channel the message is in
   * @param {User} user Author of the message
   * @param {Connection} connection Connection this message uses
   * @param {*} raw
   * @memberof Message
   */
  constructor(text: string, id: string, channel: Channel, user: User, connection: Connection, raw: any) {
    this.name = text;
    this.text = text;
    this.id = id;
    this.channel = channel;
    this.server = channel ? channel.server : null;
    this.user = user;
    this.connection = connection;
    this.raw = raw;
  }
}
