import Addon, { IAddonConfig } from './Addon';
import Input from './Input';
import Command from './Command';
import Bot from '../bot/Bot';
import IObjectMap from '../interfaces/IObjectMap';
import TextSendable from '../sendables/TextSendable';

import { mapObject } from '../util';

interface IJsonAddonConfig extends IAddonConfig {
  commands: IObjectMap<string>;
}

export default class JSONAddon extends Addon {
  private filename: string;
  private addonName: string;
  private cmdObj: IObjectMap<string>;

  version: string = '0.0.0';

  constructor(bot: Bot, filename: string) {
    super(bot);

    this.filename = filename;

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

  start(conf: IJsonAddonConfig) {
    mapObject(conf, (name, command) => {
      const cmd = new Command(
        name,
        JSONAddon.makeStringFunction(this.bot, command),
        this,
      );

      const added = this.bot.addCommand(cmd);
      if (!added) {
        console.log(`unable to add custom command: ${name}`);
      }
    });

    return Promise.resolve(true);
  }

  stop() {
    return Promise.resolve(true);
  }

  static makeStringFunction(bot: Bot, str: string) {
    return async (input: Input) => {
      let newStr: string;

      if (str.match(/{\w+}/)) {
        const server = input.channel ? input.server.name : 'private message';
        const channel = input.channel ? input.channel.name : 'private message';

        newStr = str
          .replace(/{args}/g, input.text)
          .replace(/{channel}/g, channel)
          .replace(/{server}/g, server)
          .replace(/{user}/g, input.user.toString());
      } else {
        if (input.text) {
          newStr = `${str} ${input.text}`;
        } else {
          newStr = str;
        }
      }

      return bot.process(input.from(new TextSendable(newStr)));
    };
  }
}

