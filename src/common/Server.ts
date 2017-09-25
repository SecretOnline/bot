import Thing from '../interfaces/Thing';
import Connection from './Connection';

/**
 * Base class for a server
 *
 * @abstract
 * @class Server
 * @export
 * @implements {Thing}
 */
export default abstract class Server implements Thing {
  /**
   * Name of the server
   *
   * @type {string}
   * @memberof Server
   */
  readonly name: string;

  /**
   * ID of the server
   *
   * @type {string}
   * @memberof Server
   */
  readonly id: string;

  /**
   * Connection the server uses
   *
   * @type {Connection}
   * @memberof Server
   */
  readonly connection: Connection;

  /**
   * @type {*}
   * @memberof Server
   */
  readonly raw: any;

  /**
   * Creates an instance of Server.
   * @param {string} name Name of the server
   * @param {string} id ID of the server
   * @param {Connection} connection Connection the server uses
   * @param {*} raw
   * @memberof Server
   */
  constructor(name: string, id: string, connection: Connection, raw: any) {
    this.name = name;
    this.id = id;
    this.connection = connection;
    this.raw = raw;
  }
}
