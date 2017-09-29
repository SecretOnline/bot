import Thing from '../interfaces/Thing';
import ISendable from '../interfaces/ISendable';
import Addon from './Addon';
import Input from './Input';
import User from './User';
import Channel from './Channel';

import PermissionError from '../errors/PermissionError';

export type CommandPermission =
  'DEFAULT' | 'TRUSTED' | 'ADMIN' |
  'OVERLORD' | 'SUPERUSER' | 'DISALLOWED';

export interface CommandProps {
  permission?: CommandPermission;
  help?: string;
  useRaw?: boolean;
}

type CommandFunction = (input: Input) => Promise<ISendable>;

function permValue(perm: CommandPermission): number {
  switch (perm) {
    case 'DEFAULT':
      return 1;
    case 'TRUSTED':
      return 2;
    case 'ADMIN':
      return 10;
    case 'OVERLORD':
      return 20;
    case 'SUPERUSER':
      return 50;
    case 'DISALLOWED':
    default:
      return -1;
  }
}

export function hasPermission(
  obj: CommandPermission | User | Command | Input,
  permission: CommandPermission,
  context?: Channel,
) {
  let perm: CommandPermission;

  if (obj instanceof Command) {
    perm = obj.permission;
  } else if (obj instanceof User) {
    if (context) {
      perm = obj.connection.getPermissionLevel(obj, context);
    } else {
      perm = 'DEFAULT';
    }
  } else if (obj instanceof Input) {
    perm = obj.getPermissionLevel();
  }

  return permValue(perm) >= permValue(permission);
}

const defaultOptions: CommandProps = {
  permission: 'DEFAULT',
  help: 'no help for this command is available',
  useRaw: false,
};

export default class Command implements Thing {
  private readonly fn: CommandFunction;
  private readonly options: CommandProps;

  readonly addon: Addon;
  readonly name: string;

  constructor(
    name: string,
    funct: CommandFunction,
    addon: Addon,
    options: CommandProps = {},
  ) {
    this.addon = addon;
    this.fn = funct;
    this.name = name;
    this.options = {
      ...defaultOptions,
      ...options,
    };
  }

  get id() {
    return `${this.addon.name}~${this.name}`;
  }

  get permission() {
    return this.options.permission;
  }

  get help() {
    return this.options.help;
  }

  get usesRaw() {
    return this.options.useRaw;
  }

  run(input: Input) {
    if (!hasPermission(input, this.permission)) {
      return Promise.reject(new PermissionError(this.permission));
    }

    return this.fn(input);
  }
}
