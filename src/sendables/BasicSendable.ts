import ISendable from '../interfaces/ISendable';

/**
 * A simple sendable item
 *
 * @export
 * @class BasicSendable
 */
export default class BasicSendable implements ISendable {
  /**
   * Text content of the sendable
   *
   * @type {string}
   * @memberof BasicSendable
   */
  public readonly text: string;

  protected isPrivate: boolean;

  public get private() {
    return this.isPrivate;
  }

  /**
   * Creates an instance of BasicSendable.
   * @param {string} text Text to send
   * @param {boolean} isPrivate Whether message should be sent to user instead
   * @memberof BasicSendable
   */
  constructor(text: string, isPrivate: boolean = false) {
    this.text = text;
    this.isPrivate = isPrivate;
  }

  setPrivate() {
    this.isPrivate = true;
  }
}
