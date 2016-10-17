const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');
const Channel = require('../bot/Channel.js');

let helpHelp = [
  'syntax: `~help [command]`',
  'finds help for the given command',
  'for a list of all commands, use `~commands`',
  'for all commands in a group, use `~commands [group]`',
  'to find out which group a command is in, use `~which [command]`'
];
let whichHelp = [
  'syntax: `~which <command>`',
  'alows you to find out which command group a command belongs to',
  'example usage:',
  '`~which which`'
];

class Help extends ScriptAddon {
  constructor(bot) {
    super(bot, 'help');
  }

  init() {
    this.bot.addCommand('commands', new Command(this.getCommands.bind(this), 'core', this.getCommands.bind(this)));
    this.bot.addCommand('help', new Command(this.getHelp.bind(this), 'core', helpHelp));
    this.bot.addCommand('which', new Command(this.getWhich.bind(this), 'core', Command.PermissionLevels.ADMIN, whichHelp));
  }

  deinit() {
    // Do nothing
  }

  getWhich(input) {
    let prefix = this.bot.getConfig('default').prefix;

    if (input.message.channel instanceof Channel) {
      let serverConf = input.message.channel.server.getConfig();
      if (serverConf.prefix) {
        prefix = serverConf.prefix;
      }
    }

    let comm = this.bot.getCommand(`${prefix}${input.text}`, input.message);
    if (comm) {
      return `\`${prefix}${input.text}\` is from ${comm.group}`;
    } else {
      return `unknown or disallowed command: ${input.text}`;
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
        groups.unshift(...serverConf.addons);
      }
    }

    let available = [];
    let reply = '';
    if (input.text) {
      available = this.bot.listCommands(input.message, input.text);
      reply = `secret_bot *help* -> *commands* -> ${input.text}\n` +
        `config for server: *${serverName}*\n` +
        `commands (${available.length}): ` +
        available.sort().map(item => `\`${prefix}${item}\``).join(', ');
    } else {
      available = this.bot.listCommands(input.message);
      reply = `secret_bot *help* -> *commands*\n` +
        `config for server: *${serverName}*\n` +
        `command groups enabled: ${groups.join(', ')}\n` +
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

      // Get command
      let comm = this.bot.getCommand(`${prefix}${input.text}`, input.message);
      if (comm) {
        let help = comm.help(input.from(''));

        // Return on empty string. Allows for a no-response
        if (help === '') {
          return '';
        }

        if (!help) {
          help = `no help for ${input.text} can be found`;
        }

        let header = [
          `secret_bot *help* -> *${input.text}*`,
          `command group: ${comm.group}`
        ];
        if (comm.permission) {
          switch (comm.permission) {
            case 1:
              header.push('permission required: Admin');
              break;
            case 2:
              header.push('permission required: Overlord');
              break;
          }
        }

        response = [
          ...header,
          '',
          help
        ].join('\n');

      } else {
        response = `unknown or disallowed command: ${input.text}`;
      }
    } else {
      response = 'secret_bot *help*\n' +
        'secret_bot v7.0.x - the objectively better update\n\n' +
        'secret_bot is written by secret_online\n' +
        'https://github.com/SecretOnline/bot';
    }

    input.user.send(response);
    return '';
  }
}

module.exports = Help;
