/**
 * A simple sendable item
 *
 * @export
 * @class BasicSendable
 */
export default class BasicSendable {
  /**
   * Text content of the sendable
   *
   * @type {string}
   * @memberof BasicSendable
   */
  public text: string;

  /**
   * Creates an instance of BasicSendable.
   * @param {string} text Text to send
   * @memberof BasicSendable
   */
  constructor(text: string) {
    this.text = text;
  }
}
