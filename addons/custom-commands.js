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
    this.addons = new Map();
  }

  init() {
    this.addCommand('add-command', this.addGuildCommand, Command.PermissionLevels.ADMIN, commandHelp);
    this.addCommand('remove-command', this.removeGuildCommand, Command.PermissionLevels.ADMIN, commandHelp);

    let promises = [];
    if (this.commands) {
      promises = Object.keys(this.commands).map((server) => {
        return new Promise((resolve, reject) => {
          try {
            let addon = new JSONAddon(this.bot, this.commands[server], server);
            this.addons.set(server, addon);
            resolve(addon);
          } catch (err) {
            this.error(`unable to create commands for ${server}`);
            resolve();
          }
        });
      });
    }

    return Promise.all(promises)
      .then((addons) => {
        return addons.filter(a => a);
      })
      .then((addons) => {
        addons.forEach((addon) => {
          this.bot._sneakAddon(addon);
        });
        return addons;
      })
      .then((addons) => {
        return this.bot._initAddons(addons)
          .then(() => {
            return addons;
          });
      })
      .then((addons) => {
        this.log(`loaded custom commands for ${addons.length} servers`);
        return addons;
      });
  }

  deinit() {
    // Do nothing
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
      let group = message.guild.id;
      let addonProm;

      if (this.addons.has(group)) {
        addonProm = Promise.resolve(this.addons.get(group));
      } else {
        let addon = new JSONAddon(this.bot, {}, group);
        this.addons.set(group, addon);
        this.bot._sneakAddon(addon);
        addonProm = addon.init();
      }

      addonProm
        .then((addon) => {
          addon.addCommand(trigger, response, JSONAddon.generateHelp(trigger, response));
        })
        .then(() => {
          this.setConfig(commands, message.guild);
        })
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
      let group = message.guild.id;

      if (commands[trigger]) {
        delete commands[trigger];
      } else {
        resolve(`\`${prefix}${trigger}\` wasn't found on this server`);
        return;
      }

      let addonProm;
      if (this.addons.has(group)) {
        addonProm = Promise.resolve(this.addons.get(group));
      } else {
        resolve('no commands were found for this server');
        return;
      }

      addonProm
        .then((addon) => {
          addon.removeCommand(trigger);
        })
        .then(() => {
          this.setConfig(commands, message.guild);
        })
        .then(() => {
          resolve(`removed \`${prefix}${trigger}\` from server`);
        }, reject);
    });
  }
}

module.exports = Custom;
