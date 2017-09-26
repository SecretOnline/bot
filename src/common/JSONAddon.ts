import Addon, { IAddonConfig } from './Addon';
import Bot from '../bot/Bot';
import IObjectMap from '../interfaces/IObjectMap';

import { mapObject } from '../util';

export default class JSONAddon extends Addon {
  private filename: string;
  private addonName: string;
  private commands: IObjectMap<string>;

  version: string = '0.0.0';

  constructor(bot: Bot, filename: string, commands: IObjectMap<string>) {
    super(bot);

    this.filename = filename;
    this.commands = commands;

    this.addonName = this.filename.match(/(?:.*\/)?(.*)\.json$/i)[1];
  }

  get id() {
    return this.addonName;
  }

  get name() {
    return this.addonName;
  }

  get description() {
    return `A series of call-response commands: ${this.addonName}`;
  }

  start(conf: IAddonConfig) {
    mapObject(this.commands, (name, command) => {
      // todo: Register command
    });

    return Promise.resolve(true);
  }

  stop() {
    return Promise.resolve(true);
  }
}

