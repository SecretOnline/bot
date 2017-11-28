import BotError from './BotError';
import { CommandPermission } from '../common/Command';

export default class PermissionError extends BotError {
  readonly name = 'PermissionError';

  constructor(required: CommandPermission) {
    // tslint:disable-next-line max-line-length
    super(`you do not have the required permission to use this command (must be at least \`${required}\`)`);
  }
}
