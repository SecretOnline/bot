import Thing from '../interfaces/Thing';
import Bot from '../bot/Bot';

/**
 * Base interface for addon configuration
 *
 * @export
 * @interface IAddonConfig
 */
export interface IAddonConfig {
  [x: string]: any,
}

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
  abstract start(config: IAddonConfig): Promise<boolean>;

  /**
   * Stops the addon
   *
   * @abstract
   * @returns {Promise<boolean>}
   * @memberof Addon
   */
  abstract stop(): Promise<boolean>
}
