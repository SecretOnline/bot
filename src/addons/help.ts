import Addon from '../common/Addon';
import Input from '../common/Input';
import Command from '../common/Command';
import { IServerConfig } from '../common/Server';
import AnimationSendable from '../sendables/AnimationSendable';
import SectionedSendable from '../sendables/SectionedSendable';
import TextSendable from '../sendables/TextSendable';
import AddonError from '../errors/AddonError';
import { CommandRequiresServerError } from '../errors/CommandError';
import { arrayRandom, pkg, regexEscape } from '../util';

// tslint:disable max-line-length
const defaultHelp = [
  `secret_bot v${pkg.version} - ${pkg.versionName}`,
  'for a list of available commands, use `~commands` in the server you want a list for',
  'help for individual commands can be found by using `~help <command>`',
  'secret_bot is written by secret_online',
];
const helpHelp = [
  'syntax: `~help [command]`',
  'finds help for the given command',
  'extra info about bot is available through the help topics `~help topic`',
  'for a list of all commands, use `~commands`',
  'for all commands in an addon, use `~commands <group>`',
  'to find out which addon a command is in, use `~which <command>`',
].join('\n');
const whichHelp = [
  'syntax: `~which <command>`',
  'alows you to find out which addon a command belongs to',
  'for more information about addons, use `~help topic addons`',
  'example usage:',
  '`~which which`',
].join('\n');

const topics = {
  help: [
    'secret_bot has support for commands to provide help and usage information',
    '',
    'help is accessed by using `~help [command]`',
    'e.g. `~help help`, `~help topic help`',
    '',
    'in example commands, the angled `<>` brackets mean that this argument is required, while square `[]` brackets mean it\'s optional',
    'for example `~help` can take an argument (the name of a command), but doesn\'t need one, so is written like `~help [command]`',
    '`~which` requires an argument, so is written as `~which <command>` in the help',
  ],
  addons: [
    'addons are groups of commands',
    'the main benefit of this is for server admins, who can enable and disable addons, instead of having to enable/disable individual commands',
    'you can get a list of all commands in an addon by using `~commands <addon>`',
    'to find out which addon adds a particular command, use `~which <command>`. e.g. `~which source` will reply with `core`, because `~source` is addec by the "core" addon',
    '',
    'it is possible for two different commands to have the same name, but come from different addons',
    'this generally only happens if the server owner uses `~add-command` to greate a command with the same name as an existing command',
    'in this situation, you need to add the name of the addon followed by a dot (`.`)',
    'e.g.: `~faces.lenny`, `~this.lenny`',
    '',
    'each server has a hidden addon (the server\'s ID) which can be used with the `this` keyword',
    'it is mainly used by the `custom` addon, which allows custom commands',
    'this ensures that custom commands will always work on the server they were created on',
  ],
  commands: [
    'commands form the base of secret_bot',
    'if you wanted a list of all commands available, use `~commands`. note that the result may be different depending on which server you type it in',
    '',
    'the first \'word\' of a message must be a valid command in order for secret_bot to process it',
    '',
    'commands are made of three parts: the prefix, the trigger, and arguments',
    'prefixes and triggers are explained in thir own topics: `prefixes` and `triggers`',
    'the arguments for a command are any text that follows',
    'for example `~flip upside down` has the arguments `upside` and `down`',
    'what a command does with the arguments it is given is up to that command',
    '',
    'many commands feature recursive processing. more can be read on that in the `recursive` topic',
  ],
  triggers: [
    'no, not that type of triggers',
    'in secret_bot, the trigger is the part of a command that says which command this is',
    'as an example, in `~help` the trigger is `help`',
    'some commands ask you to give a trigger. `~help`, for example, will give more specific help if you give it a trigger',
  ],
  prefixes: [
    'the prefix is the part of a command before the trigger. usually it is a single character',
    'by default it is a tilde `~`, but it can be changed per server with `~change-prefix`',
    'throughout the help, the tilde is used to denote a command, for example `~help topic prefixes`',
  ],
  recursive: [
    'secret_bot features recursive command processing',
    'that means the output from one command can be used as the arguments for another',
    'for example, `~flip ~fliptable`',
    '`~fliptable` returns a unicode emote. this is then given to `~flip` to turn upside down',
    'as shown in that example, commands work from right to left, processing the \'last\' command in a message, finally making its way down to the first',
  ],
  using: [
    'this section is about using secret_bot on your own servers',
    '',
    '**Discord**',
    'adding secret_bot to a Discord server is extremely easy',
    'first, you must have the \'Manage Server\' permission on the server',
    'then type `~bot-invite` to get the invite link',
    'follow the link, and select the server in the dropdown box',
    'done! secret_bot should now appear in you server\'s user list. it doesn\'t require any further setup, it will work right away',
    'more information can be found on GitHub. use `~source` to go there',
  ],
};
const noTopic = [
  'topic not found',
];
const noCommand = [
  'command not found',
];
// tslint:enable max-line-length

const splitWordsLengthRegex = /(?:(.{1,1024})(?:, |$))/g;

export default class Help extends Addon {
  name = 'Help';
  id = 'help';
  description = 'An addon that provides a way to access the help for each command';
  version = '9.0.0';

  constructor(bot) {
    super(bot);
  }

  async start() {
    // tslint:disable max-line-length
    this.addCommand(new Command('commands', this.getCommands, this));
    this.addCommand(new Command('help', this.getHelp, this, { help: helpHelp }));
    this.addCommand(new Command('which', this.getWhich, this, { help: whichHelp }));
    // tslint:enable max-line-length

    return true;
  }

  async getWhich(input: Input) {
    let serverConf: IServerConfig;
    if (input.server) {
      serverConf = input.server.getConfig();
    } else {
      serverConf = this.bot.getServerConfigDefault();
    }

    const prefix = serverConf.prefix;
    const escapedPrefix = regexEscape(prefix);
    let match = input.text.match(new RegExp(`^${escapedPrefix}(.+)`));
    let unprefixed = input.text;
    if (match) {
      unprefixed = match[1];
    }

    match = unprefixed.match(/^this\.(.*)/);
    let secretGroup = '';
    if (match && input.server) {
      secretGroup = input.server.id;
      unprefixed = match[1];
    }

    const comm = this.bot.getCommand(`${prefix}${secretGroup}${unprefixed}`, input.message);
    if (comm) {
      let group = comm.addon.id;

      if (input.server && group === input.server.id) {
        group = 'this';
      }

      return new TextSendable(`\`${prefix}${unprefixed}\` is from \`${group}\``);
    } else {
      return new TextSendable(`unknown or disallowed command: ${unprefixed}`);
    }
  }

  async getCommands(input: Input) {
    let serverConf: IServerConfig;
    if (input.server) {
      serverConf = input.server.getConfig();
    } else {
      serverConf = this.bot.getServerConfigDefault();
    }

    const prefix = serverConf.prefix;
    const serverName = serverConf.name;
    const groups = this.bot.getAllowedAddons(input.server);


    if (input.server) {
      const index = groups.indexOf(input.server.id);
      if (index > -1) {
        groups[index] = 'this';
      }
    }

    let available: Command[] = [];

    // tslint:disable-next-line max-line-length
    const sendable = new SectionedSendable('this command produces a long output, which secret_bot doesn\'t support on this platform', true);

    if (input.text) {
      available = this.bot.getCommandList(input, input.text);
      sendable.setTitle(`secret_bot *help* -> *commands* -> *${input.text}*`)
        .setDescription(`config for server: *${serverName}*\ncommands (${available.length}):`);
    } else {
      available = this.bot.getCommandList(input);
      sendable.setTitle('secret_bot *help* -> *commands*')
        // tslint:disable-next-line max-line-length
        .setDescription(`config for server: *${serverName}*\ncommand groups enabled: ${groups.sort().join(', ')}\ncommands (${available.length}): `);
    }

    // Send commands by group
    const groupMap = new Map<string, Command[]>();
    available.forEach((comm) => {
      let group = comm.addon.id;
      if (input.server) {
        if (group === input.server.id) {
          group = 'this';
        }
      }

      if (!groupMap.has(group)) {
        groupMap.set(group, []);
      }

      groupMap.get(group).push(comm);
    });

    Array.from(groupMap.entries())
      .sort(([n1], [n2]) => {
        if (n1 > n2) {
          return 1;
        } else if (n1 < n2) {
          return -1;
        }
        return 0;
      })
      .forEach(([name, commands]) => {
        const list = commands
          .map(c => c.name)
          .sort()
          .map(item => `\`${prefix}${item}\``)
          .join(', ');
        const parts = list.match(splitWordsLengthRegex);
        parts.forEach((item, index) => {
          sendable.addSection(
            `**${name}${index ? ' (cont.)' : ''}**`,
            item,
          );
        });

      });

    return sendable;
  }

  async getHelp(input: Input) {
    let content: string[] = [];
    let title = '';
    let desc = '';

    if (input.args.length) {
      // Help topics
      if (input.args[0] === 'topic') {
        const topic = input.args.slice(1).join(' ');

        if (topic) {
          title = `secret_bot *help topic*${topic ? ` -> *${topic}*` : ''}`;
          if (topics[topic]) {
            content = topics[topic];
          } else {
            content = noTopic;
          }
        } else {
          title = 'secret_bot *help topic*';
          desc = 'use `~help topic <name>` to view a help topic';
          content = [
            Object.keys(topics)
              .map(k => `\`${k}\``)
              .join(', '),
          ];
        }
      }

      let serverConf: IServerConfig;
      if (input.server) {
        serverConf = input.server.getConfig();
      } else {
        serverConf = this.bot.getServerConfigDefault();
      }

      const prefix = serverConf.prefix;
      const serverName = serverConf.name;
      const escapedPrefix = regexEscape(prefix);
      let match = input.text.match(new RegExp(`^${escapedPrefix}(.+)`));
      let unprefixed = input.text;
      if (match) {
        unprefixed = match[1];
      }

      match = unprefixed.match(/^this\.(.*)/);
      let secretGroup = '';
      if (match && input.server) {
        secretGroup = input.server.id;
        unprefixed = match[1];
      }

      title = `secret_bot *help* -> *${unprefixed}*`;
      const descArr: string[] = [];

      // Get command
      const comm = this.bot.getCommand(`${prefix}${unprefixed}`, input.message);
      if (comm) {
        descArr.push(`addon: ${comm.addon.id}`);

        content = [comm.help];

        // Add permission info
        if (comm.permission) {
          descArr.push(`permision required: ${comm.permission}`);
        }
      } else {
        content = noCommand;
      }

      desc = descArr.join(' ');
    } else {
      title = defaultHelp[0];
      desc = defaultHelp.slice(1).join('\n');
    }

    let defaultArr = [];
    if (title) {
      defaultArr.push(title);
    }
    if (desc) {
      defaultArr.push(desc);
    }
    defaultArr = defaultArr.concat(content);

    const sendable = new SectionedSendable(defaultArr.join('\n'), true)
      .setTitle(title)
      .setDescription(desc);

    content.forEach(t => sendable.addSection('', t));

    return sendable;
  }
}
