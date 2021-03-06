import BotError from './BotError';
import ITargetable from '../interfaces/ITargetable';

export class MessageNotSentError extends BotError {
  readonly name = 'MessageNotSent';

  constructor() {
    super('message was not sent');
  }
}

export class InvalidTargetError extends BotError {
  readonly name = 'InvalidTarget';

  constructor(target: ITargetable) {
    super('message target is not owned by connection');
  }
}

export class InvalidIDError extends BotError {
  readonly name = 'InvalidID';

  constructor(id: string) {
    super(`${id} is not owned by this connection`);
  }
}

export class UnknownIDError extends BotError {
  readonly name = 'UnknownID';

  constructor(id: string) {
    super(`${id} can not be found`);
  }
}
