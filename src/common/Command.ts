import Thing from '../interfaces/Thing';
import ISendable from '../interfaces/ISendable';
import Addon from './Addon';
import Input from './Input';

export type CommandPermission =
  'DEFAULT' | 'TRUSTED' | 'ADMIN' |
  'OVERLORD' | 'SUPERUSER' | 'DISALLOWED';

export interface CommandProps {
  permission: CommandPermission;
  help: string;
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

const defaultOptions: CommandProps = {
  permission: 'DEFAULT',
  help: 'no help for this command is available',
};

export default class Command implements Thing {
  private readonly addon: Addon;
  private readonly fn: CommandFunction;
  private readonly options: CommandProps;

  name: string;

  constructor(
    name: string,
    funct: CommandFunction,
    addon: Addon,
    options: CommandProps = defaultOptions,
  ) {
    this.addon = addon;
    this.fn = funct;
    this.name = name;
    this.options = options;
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

  run(input: Input) {
    if (permValue(this.permission) > permValue(input.getPermissionLevel())) {
      return Promise.reject('you do not have the required permission to use this command');
    }

    return this.fn(input);
  }
}
