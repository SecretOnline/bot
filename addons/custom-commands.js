const Discord = require('discord.js');

const ScriptAddon = require('../bot/ScriptAddon.js');
const JSONAddon = require('../bot/JSONAddon.js');
const Command = require('../bot/Command.js');

const {promiseChain} = require('../util');

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
  '~add-command self-ban {user} has been banned from {server} for {args}!'
];

class Custom extends ScriptAddon {
  constructor(bot) {
    super(bot, 'custom' );

    this.desc = 'Allows the creation of custom commands for your server';
    this.commands = this.getConfig(null);
    this.addons = new Map();
  }

  init() {
    this.addCommand('add-command', this.addGuildCommand, Command.PermissionLevels.ADMIN, commandHelp);
    this.addCommand('remove-command', this.removeGuildCommand, Command.PermissionLevels.ADMIN, commandHelp);

    let promises = Object.keys(this.commands)
      .filter(s => Object.keys(this.commands[s]).length > 0)
      .map((server) => {
        return new Promise((resolve, reject) => {
          if (server === 'default') {
            resolve();
            return;
          }

          let addon = this.bot.getServerAddon(server);
          resolve(addon);
        })
          .catch((err) => {
            this.error(`could not create server addon for ${server}`);
            this.error(err);
          });
      });

    return Promise.all(promises)
      .then((addons) => {
        return addons.filter(a => a);
      })
      .then((addons) => {
        let functions = addons.map((addon) => {
          return () => {
            let commands = Object.keys(this.commands[addon.namespace]);
            commands.forEach((trigger) => {
              let result = this.commands[addon.namespace][trigger];

              addon.generateCommand(trigger, result);
            });
          };
        });
        return promiseChain(functions)
          .then(() => {
            this.log(`loaded custom commands for ${addons.length} servers`);
          });
      });
  }

  addGuildCommand(input) {
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

      let addon = this.bot.getServerAddon(message.guild);
      addon.addCommand(trigger, response, JSONAddon.generateHelp(trigger, response));

      return this.setConfig(commands, message.guild)
        .then(() => {
          resolve(`added \`${prefix}${trigger}\` to server`);
        }, reject);
    });
  }

  removeGuildCommand(input) {
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
      let serverConf = this.bot.getConfig(message.guild);
      let prefix = serverConf.prefix;

      if (commands[trigger]) {
        delete commands[trigger];
      } else {
        resolve(`\`${prefix}${trigger}\` wasn't found on this server`);
        return;
      }

      let addon = this.bot.getServerAddon(message.addon);
      addon.removeCommand(trigger);

      return this.setConfig(commands, message.guild)
        .then(() => {
          resolve(`removed \`${prefix}${trigger}\` from server`);
        }, reject);
    });
  }
}

module.exports = Custom;
