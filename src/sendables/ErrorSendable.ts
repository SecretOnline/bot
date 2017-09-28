import BaseSendable from './BaseSendable';
import BotError from '../errors/BotError';

/**
 * A sendable error
 *
 * @export
 * @class ErrorSendable
 */
export default class ErrorSendable extends BaseSendable {
  readonly error: BotError;

  constructor(error: BotError) {
    super(error.toString(), true);

    this.error = error;
  }
}
