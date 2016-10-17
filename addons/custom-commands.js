const fs = require('fs');
const ScriptAddon = require('../bot/ScriptAddon.js');
const JSONAddon = require('../bot/JSONAddon.js');
const Command = require('../bot/Command.js');
const Channel = require('../bot/Channel.js');

let commandHelp = [
  'syntax: `~add-command <command trigger> <words to output>`',
  'syntax: `~remove-command <command trigger>`',
  'allows the addition of custom commands to each server',
  'commands created on one server *can not* be used on another, unless the second server enables it',
  'the words to output follow the same rules as JSON command loading',
  '`{args}` will be replaced by any processed text after this command',
  '`{user}` will be replaced by the name of the user who sent the command',
  '`{channel}` will be replaced by the channel the message was sent in',
  '`{server}` will be replaced by the name of the server',
  'example usage:',
  '~add-command self-ban {user} has been banned for {args}!'
];

class Custom extends ScriptAddon {
  constructor(bot) {
    super(bot, 'custom');

    this.commands = {};
    this.conf.path = this.conf.path || 'custom-commands.conf.json';

    fs.readFile(`./${this.conf.path}`, 'utf8', (err, data) => {
      try {
        this.commands = JSON.parse(data);
      } catch (e) {
        this.commands = {};
        fs.writeFile(this.conf.path, JSON.stringify(this.commands, null, 2));
        return;
      }

      Object.keys(this.commands).forEach((connection) => {
        Object.keys(this.commands[connection]).forEach((server) => {
          let group = `${connection}.${server}`;
          Object.keys(this.commands[connection][server]).forEach((trigger) => {
            JSONAddon.generateCommand(this.bot, group, trigger, this.commands[connection][server][trigger]);
          });
        });
      });
    });
  }

  init() {
    this.bot.addCommand('add-command', new Command(this.addCommand.bind(this), 'core', Command.PermissionLevels.ADMIN, commandHelp));
    this.bot.addCommand('remove-command', new Command(this.removeCommand.bind(this), 'core', Command.PermissionLevels.ADMIN, commandHelp));
  }

  deinit() {
    // Do nothing
  }

  addCommand(input) {
    return new Promise((resolve, reject) => {
      // Ensure custom commands can be used
      let message = input.message;
      if (!message.channel instanceof Channel) {
        reject('custom commands can\'t be used in direct messages');
      }

      // Get the list of commands for this server, making empty objects where needed
      let connection = this.commands[message.channel.connection.id];
      if (!connection) {
        connection = {};
        this.commands[message.channel.connection.id] = connection;
      }
      let commands = connection[message.channel.server.id];
      if (!commands) {
        commands = {};
        connection[message.channel.server.id] = commands;
      }

      let parts = input.text.split(' ');
      let trigger = parts.shift();
      let response = parts.join(' ');
      let prefix = this.bot.getConfig('default').prefix;
      let serverConf = message.channel.server.getConfig();
      if (serverConf && serverConf.prefix) {
        prefix = serverConf.prefix;
      }

      if (commands[trigger]) {
        resolve(`\`${prefix}${trigger}\` is already a command`);
        return;
      }

      commands[trigger] = response;
      let group = `${message.channel.connection.id}.${message.channel.server.id}`;
      JSONAddon.generateCommand(this.bot, group, trigger, response);

      fs.writeFile(this.conf.path, JSON.stringify(this.commands, null, 2), (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(`added \`${prefix}${trigger}\` to server`);
      });
    });
  }

  removeCommand(input) {
    return new Promise((resolve, reject) => {
      // Ensure custom commands can be used
      let message = input.message;
      if (!message.channel instanceof Channel) {
        reject('custom commands can\'t be used in direct messages');
      }

      // Get the list of commands for this server, making empty objects where needed
      let connection = this.commands[message.channel.connection.id];
      if (!connection) {
        connection = {};
        this.commands[message.channel.connection.id] = connection;
      }
      let commands = connection[message.channel.server.id];
      if (!commands) {
        commands = {};
        connection[message.channel.server.id] = commands;
      }

      let trigger = input.text.split(' ')[0];
      let prefix = this.bot.getConfig('default').prefix;
      let serverConf = message.channel.server.getConfig();
      let group = `${message.channel.connection.id}.${message.channel.server.id}`;
      if (serverConf && serverConf.prefix) {
        prefix = serverConf.prefix;
      }

      if (commands[trigger]) {
        delete commands[trigger];
        this.bot.removeCommand(trigger, group);
      }

      fs.writeFile(this.conf.path, JSON.stringify(this.commands, null, 2), (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(`removed \`${prefix}${trigger}\` from server`);
      });
    });
  }
}

module.exports = Custom;
