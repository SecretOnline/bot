import Thing from '../interfaces/Thing';
import ISendable from '../interfaces/ISendable';
import Addon from './Addon';
import Input from './Input';

type CommandPermission = 'DEFAULT' | 'TRUSTED' | 'ADMIN' | 'OVERLORD' | 'SUPERUSER' | 'DISALLOWED';

export interface CommandProps {
  permission: CommandPermission;
  help: string;
}

export function valueOfPermission(perm: CommandPermission): number {
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

type CommandFunction = (input: Input) => Promise<ISendable>;

const defaultOptions: CommandProps = {
  permission: 'DEFAULT',
  help: 'no help for this command is available',
};

export default class Command implements Thing {
  private addon: Addon;
  private fn: CommandFunction;
  private options: CommandProps;

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
}
