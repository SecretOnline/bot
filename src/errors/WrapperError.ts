import BotError from './BotError';

export default class WrapperError extends BotError {
  name = 'WrapperError';

  readonly error: Error;

  constructor(error: Error) {
    // tslint:disable-next-line max-line-length
    super(error.message);

    this.error = error;
    this.name = error.name;
  }

  get stack() {
    return this.error.stack;
  }
}
