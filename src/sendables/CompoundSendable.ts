import ISendable from '../interfaces/ISendable';
import BaseSendable from './BaseSendable';
import TextSendable from './TextSendable';
import ErrorSendable from './ErrorSendable';

/**
 * A group of sendable items
 *
 * @export
 * @class CompoundSendable
 */
export default class CompoundSendable extends BaseSendable {
  private sendables: ISendable[] = [];

  constructor(text: string = '', extras: ISendable[] = [], isPrivate: boolean = false) {
    super(text, isPrivate);

    this.sendables = extras;
  }

  public get private() {
    return this.isPrivate;
  }

  public get extras() {
    return this.sendables.slice();
  }

  public from(...sendables: ISendable[]) {
    let text = this.text;
    let isPrivate = this.private;
    let newSendables = [];

    let error: ErrorSendable;

    // Add sendables to
    sendables.forEach((sendable) => {
      isPrivate = sendable.private;

      if (sendable instanceof CompoundSendable) {
        // Merge CompoundSendables
        text = sendable.text;
        newSendables = newSendables.concat(sendable.extras);
      } else if (sendable instanceof TextSendable) {
        // Just set the text for a TextSendable
        text = sendable.text;
      } else if (sendable instanceof ErrorSendable) {
        error = sendable;
      } else {
        // Anything else is an extra for the new CompoundSendable
        newSendables.push(sendable);
      }
    });

    if (error) {
      return error;
    }

    return new CompoundSendable(
      text,
      newSendables,
      isPrivate,
    );
  }
}
