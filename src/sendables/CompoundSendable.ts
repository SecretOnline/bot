import ISendable from '../interfaces/ISendable';
import BasicSendable from './BasicSendable';

/**
 * A simple sendable item
 *
 * @export
 * @class CompoundSendable
 */
export default class CompoundSendable extends BasicSendable {
  private sendables: ISendable[] = [];
  private basicSendable: BasicSendable = null;

  constructor(text: BasicSendable, extras: ISendable[] = [], isPrivate: boolean = false) {
    super('', isPrivate);

    this.sendables = extras;
    this.basicSendable = text;
  }

  public get text() {
    return this.basicSendable ? this.basicSendable.text : '';
  }

  public get private() {
    return this.isPrivate;
  }

  public get extras() {
    return this.sendables.slice();
  }

  public from(...sendables: ISendable[]) {
    return new CompoundSendable(
      this.basicSendable,
      this.sendables.concat(sendables),
      this.isPrivate
    );
  }
}
