import BotError from './BotError';

export class LoggerInvalidIdError extends BotError {
  readonly name = 'LoggerInvalidId';

  constructor(id: number) {
    super(`\`${id}\` is not a valid log file`);
  }
}

export class LoggerFileReadError extends BotError {
  readonly name = 'LoggerFileRead';

  constructor(id: number) {
    super(`unable to read \`${id}\``);
  }
}

export class LoggerFileWriteError extends BotError {
  readonly name = 'LoggerFileWrite';

  constructor() {
    super('unable to write to log');
  }
}

export class LoggerInvalidTypeError extends BotError {
  readonly name = 'LoggerInvalidType';

  constructor() {
    super('unable to log this message');
  }
}
