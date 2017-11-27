import ISendable from '../interfaces/ISendable';

/**
 * Base class for a sendable
 *
 * @abstract
 * @export
 * @class BaseSendable
 */
export default abstract class BaseSendable implements ISendable {
  /**
   * Text content of the sendable
   *
   * @type {string}
   * @memberof BaseSendable
   */
  public readonly text: string;

  protected isPrivate: boolean;

  public get private() {
    return this.isPrivate;
  }

  /**
   * Creates an instance of BaseSendable.
   * @param {string} text Text to send
   * @param {boolean} isPrivate Whether message must be sent to user
   * @memberof BaseSendable
   */
  constructor(text: string, isPrivate: boolean = false) {
    this.text = text;
    this.isPrivate = isPrivate;
  }

  setPrivate() {
    this.isPrivate = true;
  }
}
