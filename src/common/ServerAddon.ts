import JSONAddon from './JSONAddon';
import Server from './Server';
import Bot from '../bot/Bot';

/**
 * An addon for a particular server
 *
 * @class ServerAddon
 * @export
 * @extends {JSONAddon}
 */
export default class ServerAddon extends JSONAddon {
  /**
   * Server the addon belongs to
   *
   * @type {Server}
   * @memberof ServerAddon
   */
  readonly server: Server;

  /**
   * Creates an instance of ServerAddon.
   * @param {Bot} bot Bot that created the Addon
   * @param {Server} server Server the addon belongs to
   * @memberof ServerAddon
   */
  constructor(bot: Bot, server: Server) {
    super(bot, server.id, {});

    this.server = server;
  }
}
