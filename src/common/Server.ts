import Thing from '../interfaces/Thing';
import Connection from './Connection';
import { IAddonConfig } from './Addon';
import IObjectMap from '../interfaces/IObjectMap';
import IIdFilter from '../interfaces/IIdFilter';
import IColorMap from '../interfaces/IColorMap';

export interface IServerConfig extends IObjectMap<any> {
  name: string;
  prefix: string;
  addons: string[];
  'addon-conf': {
    [x: string]: IAddonConfig;
  };
  color?: IColorMap;
  filter?: IIdFilter;
}

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
    this.id = `${connection.id}$${id}`;
    this.connection = connection;
    this.raw = raw;
  }

  /**
   * Gets the configuration for the server
   *
   * @returns
   * @memberof Server
   */
  getConfig() {
    return this.connection.bot.getServerConfig(this);
  }

  /**
   * Sets the configuration for the server
   *
   * @param {IServerConfig} conf
   * @returns
   * @memberof Server
   */
  setConfig(conf: IServerConfig) {
    return this.connection.bot.setServerConfig(this, conf);
  }

  /**
   * Gets the ServerAddon for this server
   *
   * @returns
   * @memberof Server
   */
  getAddon() {
    return this.connection.bot.getServerAddon(this);
  }
}
