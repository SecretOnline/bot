import BotError from './BotError';

export class AddonAlreadyExistError extends BotError {
  readonly name = 'AddonAlreadyExist';

  constructor(name: string) {
    super(`\`${name}\` is already added to the bot`);
  }
}

export class AddonNotServerError extends BotError {
  readonly name = 'AddonNotServer';

  constructor(name: string) {
    super(`\`${name}\` is not a server addon`);
  }
}
