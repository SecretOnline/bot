import Addon from '../common/Addon';
import ServerAddon from '../common/ServerAddon';
import Input from '../common/Input';
import Command from '../common/Command';
import AnimationSendable from '../sendables/AnimationSendable';
import InfoSendable from '../sendables/InfoSendable';
import TextSendable from '../sendables/TextSendable';
import ErrorSendable from '../sendables/ErrorSendable';
import AddonError from '../errors/AddonError';
import { CommandRequiresServerError } from '../errors/CommandError';
import IObjectMap from '../interfaces/IObjectMap';

import { promiseChain, mapObject } from '../util';

const commandHelp = [
  'syntax: `~add-command <command trigger> <words to output>`',
  'syntax: `~remove-command <command trigger>`',
  'allows the addition of custom commands to each server',
  'commands created on one server *can not* be used on another',
  'the words to output follow the same rules as JSON command loading',
  '`{args}` will be replaced by any processed text after this command',
  '`{user}` will be replaced by the name of the user who sent the command',
  '`{channel}` will be replaced by the channel the message was sent in',
  '`{server}` will be replaced by the name of the server',
  'example usage:',
  '~add-command self-ban {user} has been banned from {server} for {args}!',
].join('\n');

export default class Custom extends Addon {
  name = 'Custom Commands';
  id = 'custom';
  description = 'Allows the creation of custom commands for your server';
  version = '9.0.0';

  private addons = new Map<string, ServerAddon>();

  constructor(bot) {
    super(bot);
  }

  async start() {
    // tslint:disable max-line-length
    this.addCommand(new Command('add-command', this.addServerCommand, this, { help: commandHelp, permission: 'ADMIN', useRaw: true }));
    this.addCommand(new Command('remove-command', this.removeServerCommand, this, { help: commandHelp, permission: 'ADMIN', useRaw: true }));
    // tslint:enable max-line-length

    const confMap = this.bot.getAddonConfigAll(this);
    const addons = Array.from(confMap.keys())
      .map((key) => {
        try {
          const server = this.bot.getServerFromId(key);
          return this.bot.getServerAddon(server);
        } catch (err) {
          this.log(err);
          return null;
        }
      })
      .filter(a => a)
      .forEach((addon) => {
        if (!confMap.has(addon.id)) {
          return;
        }

        const commands = confMap.get(addon.id);
        mapObject(commands, (trigger, value) => {
          addon.addCommand(addon.makeCommand(trigger, value));
        });
      });

    return true;
  }

  async addServerCommand(input: Input) {
    if (!input.server) {
      throw new CommandRequiresServerError();
    }

    const commands = this.getConfig(input.server) || {};
    const serverConf = input.server.getConfig();

    const parts = input.args;
    const trigger = parts.shift();
    const response = parts.join(' ');
    const prefix = serverConf.prefix;

    if (commands[trigger]) {
      throw new AddonError(this, `\`${prefix}${trigger}\` is already a command`);
    }

    commands[trigger] = response;

    // Try saving theconfig before adding command
    try {
      await this.setConfig(input.server, commands);
    } catch (err) {
      return new ErrorSendable(new AddonError(this, 'unable to save command, try again'));
    }

    const addon = input.server.getAddon();
    addon.addCommand(addon.makeCommand(trigger, response));

    return new TextSendable(`added \`${prefix}${trigger}\` to server`);
  }

  async removeServerCommand(input: Input) {
    if (!input.server) {
      throw new CommandRequiresServerError();
    }

    const commands = this.getConfig(input.server) || {};
    const serverConf = input.server.getConfig();

    const parts = input.args;
    const trigger = parts.shift();
    const response = parts.join(' ');
    const prefix = serverConf.prefix;

    if (!commands[trigger]) {
      throw new AddonError(this, `\`${prefix}${trigger}\` is not a command`);
    }

    delete commands[trigger];

    // Try saving theconfig before adding command
    try {
      await this.setConfig(input.server, commands);
    } catch (err) {
      throw new AddonError(this, 'unable to save removal, try again');
    }

    const addon = input.server.getAddon();
    const comm = this.bot.getCommand(`${prefix}${addon.id}.${trigger}`, input.message);
    addon.removeCommand(comm);

    return new TextSendable(`removed \`${prefix}${trigger}\` from server`);
  }
}
