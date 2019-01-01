import RichSendable from './RichSendable';

/**
 * A sendable with a bit more information
 *
 * @export
 * @class InfoSendable
 */
export default class InfoSendable extends RichSendable {
  constructor(defaultText: string = '', isPrivate: boolean = false) {
    super(defaultText, isPrivate);
  }
}
