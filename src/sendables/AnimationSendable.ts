import BaseSendable from './BaseSendable';
import TextSendable from './TextSendable';

/**
 * A text animation
 *
 * @export
 * @class AnimationSendable
 */
export default class AnimationSendable extends BaseSendable {
  readonly frames: TextSendable[];
  readonly delay: number;

  constructor(frames: string[], delay = 1000, defaultText = frames[0], isPrivate = false) {
    super(defaultText, isPrivate);

    this.frames = frames.map(f => new TextSendable(f));
    this.delay = delay;
  }
}
