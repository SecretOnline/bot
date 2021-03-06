import Command from './Command';
import Server from './Server';
import User from './User';
import Message from './Message';
import Thing from '../interfaces/Thing';
import IObjectMap from '../interfaces/IObjectMap';
import Bot from '../bot/Bot';
import { AddonNotImplementedError } from '../errors/AddonError';

/**
 * Base interface for addon configuration
 *
 * @export
 * @interface IAddonConfig
 */
export interface IAddonConfig extends IObjectMap<any> {}

/**
 * Base class for an addon
 *
 * @abstract
 * @class Addon
 * @export
 * @implements {Thing}
 */
export default abstract class Addon implements Thing {
  /**
   * Bot that created the Addon
   *
   * @type {Bot}
   * @memberof Addon
   */
  readonly bot: Bot;

  /**
   * Name of the addon
   *
   * @abstract
   * @type {string}
   * @memberof Addon
   */
  readonly abstract name: string;

  /**
   * ID of the addon
   *
   * @abstract
   * @type {string}
   * @memberof Addon
   */
  readonly abstract id: string;

  /**
   * Version of the addon
   *
   * @abstract
   * @type {string}
   * @memberof Addon
   */
  readonly abstract version: string;

  /**
   * Description of the addon
   *
   * @abstract
   * @type {string}
   * @memberof Addon
   */
  readonly abstract description: string;

  /**
   * Creates an instance of Addon.
   * @param {Bot} bot Bot that created the Addon
   * @memberof Addon
   */
  constructor(bot: Bot) {
    this.bot = bot;
  }

  /**
   * Starts the addon
   *
   * @abstract
   * @param {AddonConfig} config Configuration for the addon
   * @returns {Promise<boolean>}
   * @memberof Addon
   */
  async start(config: IAddonConfig): Promise<boolean> {
    throw new AddonNotImplementedError();
  }

  /**
   * Stops the addon
   *
   * @abstract
   * @returns {Promise<boolean>}
   * @memberof Addon
   */
  async stop() {
    return true;
  }

  /**
   * Add a command to the bot
   *
   * @param {Command} command Command to add
   * @memberof Addon
   */
  addCommand(command: Command) {
    return this.bot.addCommand(command);
  }

  /**
   * Remove a command from the bot
   *
   * @param {Command} command Command to remove
   * @memberof Addon
   */
  removeCommand(command: Command) {
    return this.bot.removeCommand(command);
  }

  /**
   * Gets the configuration for the addon in the given context
   *
   * @param {(Server | User)} [context]
   * @returns
   * @memberof Addon
   */
  getConfig(context?: Server | User) {
    return this.bot.getAddonConfig(this, context);
  }

  /**
   * Sets the configuration for the addon in the given context
   *
   * @param {Server} context
   * @param {IAddonConfig} conf
   * @returns
   * @memberof Addon
   */
  setConfig(context: Server | User, conf: IAddonConfig) {
    return this.bot.setAddonConfig(this, context, conf);
  }

  /**
   * Gets called with every message that comes into the bot,
   * but only if this addon is enabled in that server
   *
   * @param {Message} message
   * @memberof Addon
   */
  onMessage(message: Message) {}

  /**
   * Logs a message
   *
   * @param {any} message
   * @memberof Addon
   */
  log(message) {
    return this.bot.log(message, this);
  }
}
