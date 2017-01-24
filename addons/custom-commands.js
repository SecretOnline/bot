const Discord = require('discord.js');

const ScriptAddon = require('../bot/ScriptAddon.js');
const JSONAddon = require('../bot/JSONAddon.js');
const Command = require('../bot/Command.js');

let commandHelp = [
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
  '~add-command self-ban {user} has been banned from {server} for {args}!'
];

class Custom extends ScriptAddon {
  constructor(bot) {
    super(bot, 'custom');

    this.commands = this.getConfig(null);

    if (this.commands) {
      Object.keys(this.commands).forEach((server) => {
        Object.keys(this.commands[server]).forEach((trigger) => {
          JSONAddon.generateCommand(this.bot, server, trigger, this.commands[server][trigger]);
        });
      });
    }
  }

  init() {
    this.bot.addCommand('add-command', new Command(this.addCommand.bind(this), 'core.custom', Command.PermissionLevels.ADMIN, commandHelp));
    this.bot.addCommand('remove-command', new Command(this.removeCommand.bind(this), 'core.custom', Command.PermissionLevels.ADMIN, commandHelp));
  }

  deinit() {
    // Do nothing
  }

  addCommand(input) {
    return new Promise((resolve, reject) => {
      // Ensure custom commands can be used
      let message = input.message;
      if (!(message.channel instanceof Discord.TextChannel)) {
        reject('custom commands can\'t be used in direct messages');
      }

      // Get the list of commands for this server, making empty objects where needed
      let commands = this.getConfig(message.guild);
      if (!commands) {
        commands = {};
      }

      let parts = input.text.split(' ');
      let trigger = parts.shift();
      let response = parts.join(' ');
      let serverConf = this.bot.getConfig(message.guild);
      let prefix = serverConf.prefix;

      if (commands[trigger]) {
        resolve(`\`${prefix}${trigger}\` is already a command`);
        return;
      }

      commands[trigger] = response;
      let group = message.guild.id;
      JSONAddon.generateCommand(this.bot, group, trigger, response);

      this.setConfig(commands, message.guild)
        .then(() => {
          resolve(`added \`${prefix}${trigger}\` to server`);
        }, reject);
    });
  }

  removeCommand(input) {
    return new Promise((resolve, reject) => {
      // Ensure custom commands can be used
      let message = input.message;
      if (!(message.channel instanceof Discord.TextChannel)) {
        reject('custom commands can\'t be used in direct messages');
      }

      // Get the list of commands for this server, making empty objects where needed
      let commands = this.getConfig(message.guild);
      if (!commands) {
        commands = {};
      }

      let trigger = input.text.split(' ')[0];
      let prefix = this.bot.getConfig('default').prefix;
      let serverConf = this.bot.getConfig(message.guild);
      let group = message.guild.id;
      if (serverConf && serverConf.prefix) {
        prefix = serverConf.prefix;
      }

      if (commands[trigger]) {
        delete commands[trigger];
        this.bot.removeCommand(trigger, group);
      }

      this.setConfig(commands, message.guild)
        .then(() => {
          resolve(`removed \`${prefix}${trigger}\` from server`);
        }, reject);
    });
  }
}

module.exports = Custom;
