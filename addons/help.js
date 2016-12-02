const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');
const Channel = require('../bot/Channel.js');

let helpHelp = [
  'syntax: `~help [command]`',
  'finds help for the given command',
  'extra info about bot is available through the help topics `~help topic`',
  'for a list of all commands, use `~commands`',
  'for all commands in a group, use `~commands <group>`',
  'to find out which group a command is in, use `~which <command>`'
];
let whichHelp = [
  'syntax: `~which <command>`',
  'alows you to find out which command group a command belongs to',
  'for more information about groups, use `~help groups`',
  'example usage:',
  '`~which which`'
];
let topics = {
  help: [
    'secret_bot has support for commands to provide help and usage information',
    '',
    'help is accessed by using `~help [command]`',
    'e.g. `~help help`, `~help topic help`',
    '',
    'in example commands, the angled `<>` brackets mean that this argument is required, while square `[]` brackets mean it\'s optional',
    'for example `~help` can take an argument (the name of a command), but doesn\'t need one, so is written like `~help [command]`',
    '`~which` requires an argument, so is written as `~which <command>` in the help'
  ],
  groups: [
    'command groups do what they say: they group commands together',
    'the main benefit of this is for server admins, who can enable and disable groups',
    'you can get a list of all commands in a group by using `~commands <group>`',
    'to find out which group a particular command is in, use `~which <command>`. e.g. `~which help`',
    '',
    'if two commands have a conflicting name, then you must use the group to identify which one to use',
    'for example: `~faces.lenny`, `~someothergroup.lenny`',
    '',
    'each server had a hidden group of the format `<connection>.<server>`, which is used by, among others, the custom commands addon',
    'this ensures that custom commands will always work on their server'
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
    'many commands feature recursive processing. more can be read on that in the `recursive` topic'
  ],
  triggers: [
    'no, not that type of triggers',
    'in secret_bot, the trigger is the part of a command that says which command this is',
    'as an example, in `~help` the trigger is `help`',
    'some commands ask you to give a trigger. `~help`, for example, will give more specific help if you give it a trigger'
  ],
  prefixes: [
    'the prefix is the part of a command before the trigger. usually it is a single character',
    'by default it is a tilde `~`, but it can be changed per server with `~change-prefix`',
    'throughout the help, the tilde is used to denote a command, for example `~help topic prefixes`'
  ],
  recursive: [
    'secret_bot features recursive command processing',
    'that means the output from one command can be used as the arguments for another',
    'for example, `~flip ~fliptable`',
    '`~fliptable` returns a unicode emote. this is then given to `~flip` to turn upside down',
    'as shown in that example, commands work from right to left, processing the \'last\' command in a message, finally making its way down to the first'
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
    '',
    '**Other Platforms**',
    'secret_bot doesn\'t support other platforms yet',
    '',
    '**Custom Connections**',
    'more information on how to add connections to secret_bot will be coming in the future, and will appear on GitHub'
  ]
};

class Help extends ScriptAddon {
  constructor(bot) {
    super(bot, 'help');
  }

  init() {
    this.bot.addCommand('commands', new Command(this.getCommands.bind(this), 'core.help', this.getCommands.bind(this)));
    this.bot.addCommand('help', new Command(this.getHelp.bind(this), 'core.help', helpHelp));
    this.bot.addCommand('which', new Command(this.getWhich.bind(this), 'core.help', whichHelp));
  }

  deinit() {
    // Do nothing
  }

  getWhich(input) {
    let prefix = this.bot.getConfig('default').prefix;
    let channel = input.message.channel;

    if (channel instanceof Channel) {
      let serverConf = channel.server.getConfig();
      if (serverConf.prefix) {
        prefix = serverConf.prefix;
      }
    }

    let escapedPrefix = prefix.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
    let match = input.text.match(new RegExp(`^${escapedPrefix}(.+)`));
    let unprefixed = input.text;
    if (match) {
      unprefixed = match[1];
    }

    match = unprefixed.match(/^this\.(.*)/);
    let secretGroup = '';
    if (match) {
      secretGroup = `${channel.connection.id}.${channel.server.id}.`;
      unprefixed = match[1];
    }

    let comm = this.bot.getCommand(`${prefix}${secretGroup}${unprefixed}`, input.message);
    if (comm) {
      let group = comm.group;

      if (group === `${channel.connection.id}.${channel.server.id}`) {
        group = 'this';
      }

      return `\`${prefix}${unprefixed}\` is from \`${group}\``;
    } else {
      return `unknown or disallowed command: ${unprefixed}`;
    }
  }

  getCommands(input) {
    let def = this.bot.getConfig('default');
    let prefix = def.prefix;
    let groups = def.addons;
    let serverName = 'private messages';

    if (input.message.channel instanceof Channel) {
      serverName = input.message.channel.server.name;
      let serverConf = input.message.channel.server.getConfig();
      if (serverConf.prefix) {
        prefix = serverConf.prefix;
      }
      if (serverConf.addons) {
        groups = groups.concat(serverConf.addons);
      }
    }

    let available = [];
    let reply = '';
    if (input.text) {
      available = this.bot.listCommands(input.message, input.text);
      reply = `secret_bot *help* -> *commands* -> *${input.text}*\n` +
        `config for server: *${serverName}*\n` +
        `commands (${available.length}): ` +
        available.sort().map(item => `\`${prefix}${item}\``).join(', ');
    } else {
      available = this.bot.listCommands(input.message);
      reply = `secret_bot *help* -> *commands*\n` +
        `config for server: *${serverName}*\n` +
        `command groups enabled: ${groups.sort().join(', ')}\n` +
        `commands (${available.length}): ` +
        available.sort().map(item => `\`${prefix}${item}\``).join(', ');
    }

    input.user.send(reply);
    // Don't send anything to server channel
    return '';
  }

  getHelp(input) {
    let response;

    if (input.text) {
      let prefix = this.bot.getConfig('default').prefix;

      if (input.message.channel instanceof Channel) {
        let serverConf = input.message.channel.server.getConfig();
        if (serverConf.prefix) {
          prefix = serverConf.prefix;
        }
      }

      let escapedPrefix = prefix.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
      let match = input.text.match(new RegExp(`^${escapedPrefix}(.+)`));
      let unprefixed = input.text;
      if (match) {
        unprefixed = match[1];
      }

      let header = [
        `secret_bot *help* -> *${unprefixed}*`
      ];
      let help = '';

      // Get command
      let comm = this.bot.getCommand(`${prefix}${unprefixed}`, input.message);
      if (comm) {
        header.push(`command group: ${comm.group}`);

        help = comm.help(input.from(''));
        // Return on empty string. Allows for a no-response
        if (help === '') {
          return '';
        }
        if (!help) {
          help = `no help for \`${unprefixed}\` can be found`;
        }

        if (comm.permission) {
          switch (comm.permission) {
            case Command.PermissionLevels.ADMIN:
              header.push('permission required: Admin');
              break;
            case Command.PermissionLevels.OVERLORD:
              header.push('permission required: Overlord');
              break;
            case Command.PermissionLevels.SUPERUSER:
              header.push('permission required: SuperUser');
              break;
          }
        }
      } else {
        let parts = input.text.split(' ');
        if (parts.shift() === 'topic') {
          header = [
            'secret_bot *help* -> *topic*'
          ];
          let rest = parts.join(' ');
          if (!rest) {
            help = [
              'available help topics (use `~help topic <topic>` to view):',
              Object.keys(topics).sort().map(item => `\`${item}\``).join(', ')
            ].join('\n');
          } else if (topics[rest]) {
            header[0] += ` -> *${rest}*`;
            help = topics[rest].join('\n');
          } else {
            help = `no help topic named ${rest}`;
          }
        } else {
          help = `unknown or disallowed command: ${unprefixed}`;
        }
      }

      response = [
        ...header,
        '',
        help
      ].join('\n');
    } else {
      response = [
        'secret_bot *help*',
        'secret_bot v7.0.x - the objectively better update',
        '',
        'help for individual commands can be found by using `~help <command>`',
        'more help topics can be found at `~help topic`',
        '',
        'secret_bot is written by secret_online',
        'https://github.com/SecretOnline/bot'
      ].join('\n');
    }

    input.user.send(response);
    return '';
  }
}

module.exports = Help;
