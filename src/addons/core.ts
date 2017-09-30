import Addon from '../common/Addon';
import Input from '../common/Input';
import Command from '../common/Command';
import AnimationSendable from '../sendables/AnimationSendable';
import InfoSendable from '../sendables/InfoSendable';
import TextSendable from '../sendables/TextSendable';
import AddonError from '../errors/AddonError';
import { CommandRequiresServerError } from '../errors/CommandError';
import { arrayRandom } from '../util';

import Discord from '../connections/Discord';


// const time = 2 * 1000;
const gameChangeTime = 30 * 60 * 1000;
// const variation = 1 * 1000;
const gameChangeVariation = 10 * 60 * 1000;


// tslint:disable max-line-length
const enablerHelp = [
  'syntax: `~<enable/disable>-addon <addon name>`',
  'the `enable/disable-addon` commands allow you to add and remove command groups from your server',
].join('\n');
const channelFilterHelp = [
  'syntax: `~[dis]allow-channel <channel mention>`',
  'restricts secret_bot to specific channels',
  'by default bot is available on all channels',
  'adding a channel to the filter means secret_bot will only work in those channels',
].join('\n');
const reloadHelp = 'really? you needed help for this? and you\'re the one in charge of this bot...';
const changePrefixHelp = [
  'syntax: `~change-prefix <character>`',
  'changes the prefix used to trigger commands',
  'default is `~`',
].join('\n');
const changeColorHelp = [
  'syntax: `~change-color #<color>`',
  'changes the color secret_bot uses for embeds',
  'default is `#001855`',
].join('\n');
const inviteHelp = 'helps you to invite the bot to your own server';
const sourceHelp = 'displays information about secret_bot\'s source code';

const inviteLink = 'https://discordapp.com/oauth2/authorize?client_id=177875535391752192&scope=bot&permissions=93184';
// tslint:enable max-line-length

export default class Core extends Addon {
  name = 'Core';
  id = 'core';
  description = 'Contains commands that are important for the bot\'s functionality';
  version: '9.0.0';

  constructor(bot) {
    super(bot);
  }

  async start() {
    // tslint:disable max-line-length
    this.addCommand(new Command('change-prefix', this.changeCommandPrefix, this, { help: changePrefixHelp, permission: 'ADMIN' }));
    this.addCommand(new Command('change-color', this.changeColor, this, { help: changeColorHelp, permission: 'ADMIN' }));
    this.addCommand(new Command('invite', this.getInviteLink, this, { help: inviteHelp }));
    this.addCommand(new Command('source', this.getSourceInfo, this, { help: sourceHelp }));
    this.addCommand(new Command('enable-addon', this.addToServer, this, { help: enablerHelp }));
    this.addCommand(new Command('disable-addon', this.removeFromServer, this, { help: enablerHelp }));
    // this.addCommand(new Command('enable-channel', this.addToFilter, this, { help: channelFilterHelp }));
    // this.addCommand(new Command('disable-channel', this.removeFromFilter, this, { help: channelFilterHelp }));
    // tslint:enable max-line-length

    return true;
  }

  async changeCommandPrefix(input: Input) {
    if (!input.server) {
      throw new CommandRequiresServerError();
    }

    // You need something to set it to, duh
    if (input.text) {
      // Take first word of input
      const prefix = input.text.split(' ').shift();
      const server = input.server;

      // Set command prefix
      const serverConf = server.getConfig();
      serverConf.prefix = prefix;
      await server.setConfig(serverConf);

      return new TextSendable(`command prefix changed to \`${prefix}\``);
    } else {
      throw new AddonError(this, 'no prefix specified');
    }
  }

  async changeColor(input: Input) {
    if (!input.server) {
      throw new CommandRequiresServerError();
    }

    // You need something to set it to, duh
    if (input.text) {
      // Take first word of raw input
      const color = input.args[0];

      if (!color.match(/#[0-9a-fA-F]{6}/)) {
        throw new AddonError(this, `${color} isn't a hex colour (\`#xxxxxx\`)`);
      }

      // Set command prefix
      const serverConf = input.server.getConfig();
      const currentMap = this.bot.getColorMap(input.server);
      currentMap.normal = color;
      serverConf.color = currentMap;
      input.server.setConfig(serverConf);

      return new TextSendable(`bot color changed to \`${color}\` in this server`);
    } else {
      throw new AddonError(this, 'no colour specified');
    }
  }

  async getInviteLink(input: Input) {
    // Just return link if more than this command, otherwise give a bigger description

    if (input.connection instanceof Discord) {
      return new TextSendable(inviteLink);
    } else {
      // tslint:disable-next-line max-line-length
      throw new AddonError(this, 'secret_bot doesn\'t have easy instructions for this platform yet');
    }
  }

  async getSourceInfo(input: Input) {
    return new InfoSendable('https://github.com/SecretOnline/bot')
      .setTitle('SecretOnline/bot')
      .setDescription('A modular chat bot for Discord, and potentially others')
      .setUrl('https://github.com/SecretOnline/bot')
      .setThumbnail('https://avatars0.githubusercontent.com/u/29110153')
      .setColor('#333333');
  }

  async addToServer(input: Input) {
    if (!input.server) {
      throw new CommandRequiresServerError();
    }

    const serverConf = input.server.getConfig();
    if (serverConf.addons) {
      input.args.forEach((addon) => {
        if (!serverConf.addons.includes(addon)) {
          serverConf.addons.push(addon);
        }
      });
    } else {
      serverConf.addons = input.args;
    }

    input.server.setConfig(serverConf);
    return new TextSendable(`enabled ${input.args.map(a => `\`${a}\``).join(', ')} on this server`);
  }

  async removeFromServer(input: Input) {
    if (!input.server) {
      throw new CommandRequiresServerError();
    }

    const serverConf = input.server.getConfig();
    if (!(serverConf.addons && serverConf.addons.length)) {
      return new TextSendable('you didn\'t have any addons to disable');
    }

    const args = input.args;
    serverConf.addons = serverConf.addons.filter(a => !args.includes(a));

    input.server.setConfig(serverConf);

    // tslint:disable-next-line max-line-length
    return new TextSendable(`disabled ${input.args.map(a => `\`${a}\``).join(', ')} on this server`);
  }

  async addToFilter(input: Input) {
    if (!input.server) {
      throw new CommandRequiresServerError();
    }

    throw new AddonError(this, 'channel restriction can not be performed by commands at this time');
  }

  async removeFromFilter(input: Input) {
    if (!input.server) {
      throw new CommandRequiresServerError();
    }

    throw new AddonError(this, 'channel restriction can not be performed by commands at this time');
  }
}
