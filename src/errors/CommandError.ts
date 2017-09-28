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
