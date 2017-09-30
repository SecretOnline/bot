import BotError from './BotError';
import Addon from '../common/Addon';

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

export class AddonNotImplementedError extends BotError {
  readonly name = 'AddonNotImplemented';

  constructor() {
    super('this function is not implemented');
  }
}

export default class AddonError extends BotError {
  name = 'Addon';

  constructor(addon: Addon, message: string) {
    super(message);

    this.name = addon.name;
  }
}
