import RichSendable from './RichSendable';

/**
 * A sendable with a bit more information
 *
 * @export
 * @class SectionedSendable
 */
export default class SectionedSendable extends RichSendable {
  constructor(defaultText: string = '', isPrivate: boolean = false) {
    super(defaultText, isPrivate);
  }
}
