import Thing from '../interfaces/Thing';
import ITargetable from '../interfaces/ITargetable';
import Connection from './Connection';
import Server from './Server';
import ISendable from '../interfaces/ISendable';

/**
 * Base class for a channel
 *
 * @abstract
 * @class Channel
 * @export
 * @implements {Thing}
 * @implements {ITargetable}
 */
export default abstract class Channel implements Thing, ITargetable {
  /**
   * Name of the channel
   *
   * @type {string}
   * @memberof Channel
   */
  readonly name: string;

  /**
   * ID of the channel
   *
   * @type {string}
   * @memberof Channel
   */
  readonly id: string;

  /**
   * Server the channel is in
   *
   * @type {Server}
   * @memberof Channel
   */
  readonly server: Server;

  /**
   * Connection the channel uses
   *
   * @type {Connection}
   * @memberof Channel
   */
  readonly connection: Connection;

  /**
   * @type {*}
   * @memberof Channel
   */
  readonly raw: any;

  /**
   * Creates an instance of Channel.
   * @param {string} name Name of the channel
   * @param {string} id ID of the channel
   * @param {Server} server Server the channel is in
   * @param {Connection} connection Connection the channel uses
   * @param {*} raw
   * @memberof Channel
   */
  constructor(name: string, id: string, server: Server, connection: Connection, raw: any) {
    this.name = name;
    this.id = `${connection.id}$${server.id}#${id}`;
    this.server = server;
    this.connection = connection;
    this.raw = raw;
  }

  /**
   * Sends a message to the channel
   *
   * @param {ISendable} msg Message to send
   * @returns {Promise<Message>}
   * @memberof Channel
   */
  send(msg: ISendable) {
    return this.connection.send(this, msg);
  }
}
