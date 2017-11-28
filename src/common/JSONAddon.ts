import Addon, { IAddonConfig } from './Addon';
import Input from './Input';
import Command from './Command';
import Bot from '../bot/Bot';
import IObjectMap from '../interfaces/IObjectMap';
import TextSendable from '../sendables/TextSendable';

import { mapObject } from '../util';

export default class JSONAddon extends Addon {
  private filename: string;
  private addonName: string;
  private cmdObj: IObjectMap<string>;

  version: string = '0.0.0';

  constructor(bot: Bot, filename: string, commands: IObjectMap<string>) {
    super(bot);

    this.filename = filename;
    this.cmdObj = commands;

    const match = this.filename.match(/(?:.*[\\/])?([^\\/]*)\.json$/i);
    if (match) {
      this.addonName = match[1];
    } else {
      this.addonName = this.filename;
    }
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

  async start(conf: IAddonConfig) {
    mapObject(this.cmdObj, (name, command) => {
      const cmd = this.makeCommand(name, command);

      try {
        this.addCommand(cmd);
      } catch (err) {
        this.log(err);
      }
    });

    return true;
  }

  stop() {
    return Promise.resolve(true);
  }

  makeCommand(name: string, command: string) {
    return new Command(
      name,
      JSONAddon.makeStringFunction(this.bot, command),
      this,
    );
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

