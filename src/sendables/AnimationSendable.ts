import BaseSendable from './BaseSendable';
import TextSendable from './TextSendable';

const notSupported = 'this animation is not currently supported by this platform';

/**
 * A text animation
 *
 * @export
 * @class AnimationSendable
 */
export default class AnimationSendable extends BaseSendable {
  readonly frames: Promise<TextSendable>[];
  readonly delay: number;

  constructor(
    frames: (string | Promise<string>)[],
    delay = 1000,
    defaultText = (typeof frames[0] === 'string') ? <string>frames[0] : notSupported,
    isPrivate = false,
  ) {
    super(defaultText, isPrivate);

    this.frames = frames.map(f => Promise.resolve(f).then(r => new TextSendable(r)));
    this.delay = delay;
  }
}
