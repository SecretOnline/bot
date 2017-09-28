/**
 *  An error created by the bot
 *
 * @abstract
 * @class BotError
 * @export
 * @extends {Error}
 */
export default abstract class BotError extends Error {
  /**
   * Name of this error
   *
   * @abstract
   * @type {string}
   * @memberof BotError
   */
  abstract readonly name: string;
}
