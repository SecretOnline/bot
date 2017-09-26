import BaseSendable from './BaseSendable';

/**
 * A sendable of only text
 *
 * @export
 * @class TextSendable
 */
export default class TextSendable extends BaseSendable {
  /**
   * Creates an instance of TextSendable.
   * @param {string} [text=''] Content of this sendable
   * @param {boolean} [isPrivate=false] Whether message must be sent to user
   * @memberof TextSendable
   */
  constructor(text: string = '', isPrivate: boolean = false) {
    super(text, isPrivate);
  }
}
