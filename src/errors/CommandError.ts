import BotError from './BotError';

export class CommandNotFoundError extends BotError {
  readonly name = 'CommandNotFound';

  constructor(prefix: string, name: string) {
    super(`\`${prefix}${name}\` is not a valid command`);
  }
}

export class CommandNotEnabledError extends BotError {
  readonly name = 'CommandNotEnabled';

  constructor(prefix: string, name: string, addons: string[]) {
    // tslint:disable-next-line max-line-length
    super(`\`${prefix}${name}\` is not enabled. it can be found in these addons: ${addons.map(a => `\`${a}\``).join()}`);
  }
}

export class CommandMultipleAddonsError extends BotError {
  readonly name = 'CommandMultipleAddons';

  constructor(prefix: string, name: string, addons: string[]) {
    // tslint:disable-next-line max-line-length
    super(`\`${prefix}${name}\` is added by multiple addons (${addons.map(a => `\`${a}\``).join()}). use \`${prefix}<group>.${name}\` instead`);
  }
}

export class CommandDuplicateError extends BotError {
  readonly name = 'CommandDuplicate';

  constructor(prefix: string, name: string) {
    super(`\`${prefix}${name}\` can not be added`);
  }
}

export class CommandRequiresServerError extends BotError {
  readonly name = 'CommandRequiresServer';

  constructor() {
    super('command can not be run in a private channel');
  }
}
