const fs = require('fs');

const Discord = require('discord.js');

const Addon = require('./Addon.js');
const JSONAddon = require('./JSONAddon.js');
const ScriptAddon = require('./ScriptAddon.js');
const Command = require('./Command.js');
const Input = require('./Input.js');

const util = require('../util');

class Bot {
  constructor(confPath) {
    this.conf = require(`../${confPath}`);
    this.confPath = confPath;

    this.serverConf = new Map();

    this.commands = new Map();
    this.addons = [];
    this.allM = [];
    this._discord = new Discord.Client();
  }

  //region Properties

  get discord() {
    return this._discord;
  }

  //endregion

  //region Functions

  start() {
    return Promise.resolve()
      .then(this.reloadConfig.bind(this))
      .then(this.reloadConnections.bind(this))
      .then(this.reloadAddons.bind(this))
      .then(() => {
        this.log('Loading complete');
      });
  }

  stop() {

  }

  reloadConfig() {
    return this._listDirectory(this.conf.paths.conf)
      .then(this._loadConfig.bind(this))
      .then(this._initConfig.bind(this))
      .then((arr) => {
        this.log(`loaded ${arr.length} config files`);
        return arr;
      });
  }

  reloadAddons() {
    return this._deinitAddons(this.addons)
      .catch((err) => {
        this.error('Error while trying to deinit addons');
        this.error(err);
      })
      .then(() => {
        return this._listDirectory(this.conf.paths.addons)
          .then((files) => {
            if (this.conf.dev && this.conf.dev.addons) {
              if (this.conf.dev.addons.whitelist) {
                return files.filter(a => this.conf.dev.addons.whitelist.includes(a));
              }
              if (this.conf.dev.addons.blacklist) {
                return files.filter(a => !this.conf.dev.addons.blacklist.includes(a));
              }
            }
            // If no filtering occurs, return them all
            return files;
          })
          .then(this._createAddons.bind(this))
          .then(this._initAddons.bind(this))
          .then((arr) => {
            this.log(`loaded ${arr.length} addons`);
            this.log(`${this.commands.size} commands`);
            return arr;
          });
      });
  }

  reloadConnections() {
    return this._closeConnections()
      .then(util.promprint('[BOT] loading connections'))
      .then(this._openConnections.bind(this))
      .then(util.promprint('[BOT] loaded connections'));
  }

  addCommand(trigger, command) {
    trigger.replace(/\./g, '');
    if (this.commands.has(trigger)) {
      let commands = this.commands.get(trigger);
      if (!Array.isArray(commands)) {
        commands = [commands];
      }

      if (commands.find(c => c.group === command.group)) {
        return false;
      }

      commands.push(command);
      this.commands.set(trigger, commands);
      return true;
    } else {
      this.commands.set(trigger, command);
      return true;
    }
  }

  removeCommand(trigger, group) {
    var comm = this.commands.get(trigger);

    if (comm) {
      if (Array.isArray(comm)) {
        let command = comm.find(c => c.group === group);

        if (command) {
          if (command.group === group) {
            let index = comm.indexOf(command);
            comm.splice(index, 1);

            if (comm.length === 0) {
              this.commands.delete(trigger);
            }
            return true;
          } else {
            return false;
          }
        } else {
          return true;
        }
      } else {
        if (comm.group === group) {
          this.commands.delete(trigger);
          return true;
        } else {
          return false;
        }
      }
    } else {
      return true;
    }
  }

  getCommand(trigger, message) {
    // Quick exit for non-string triggers
    // TBH, not sure when this would occur, but it was in the last version of bot
    if (typeof trigger !== 'string') {
      return false;
    }
    // Quick exit for empty strings, since every message ends with one
    if (trigger === '') {
      return false;
    }

    let groups = this.conf.default.always.slice();
    groups.push('core');
    let prefix = this.conf.default.prefix;
    let permLevel = Command.PermissionLevels.DEFAULT;

    // Add other groups into list for channel
    if (message.channel instanceof Discord.GuildChannel) {
      let servConf = this.getConfig(message.guild);
      if (servConf) {
        // Add server-specific addons to list
        if (servConf.addons) {
          groups.unshift(...servConf.addons);
        }
        // Set the prefix, if applicable
        if (servConf.prefix) {
          prefix = servConf.prefix;
        }
      }
      groups.push(message.channel.guild.id);
      // Get the user's actual permission level for this channel
      permLevel = this.getPermissionLevel(message);
    } else {
      groups.unshift(...this.conf.default.addons);
    }

    // Actually make sure this is a command
    // (yes, we neded to get this far before we could check)
    let escapedPrefix = prefix.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
    let match = trigger.match(new RegExp(`^${escapedPrefix}(.+)`));
    if (!match) {
      return false;
    }
    let commName = match[1];

    // group.trigger style commands
    match = commName.match(/(.+)\.(.+)/);
    if (match) {
      // `this` is replaced with connection.server
      if (match[1] === 'this') {
        match[1] = message.channel.guild.id;
      }

      if (!groups.includes(match[1])) {
        throw new Error(`the command group \`${match[1]}\` is not enabled on this server`);
      }

      // Filter to only the specified group
      groups = [match[1]];
      commName = match[2];
    }

    // Actually get the command
    let comm = this.commands.get(commName);
    if (!comm) {
      throw new Error(`\`${prefix}${commName}\` is not a valid command`);
    }

    // Handle the array case
    if (Array.isArray(comm)) {
      let allowed = comm.filter(c => groups.find(g => c.group.match(new RegExp(`^${g}(\\.[\\w._-]+)?$`))));
      // Maybe in the future give a message saying that there was a conflict
      if (allowed.length > 1) {
        let allowedGroups = allowed.map(c => `\`${c.group}\``).join(' ');
        throw new Error(`\`${prefix}${commName}\` is added by multiple command groups (${allowedGroups}). use \`${prefix}<group>.${commName}\` instead`);
      } else if (allowed.length === 0) {
        throw new Error(`\`${prefix}${commName}\` is added by multiple command groups, but none of them are enabled`);
      }
      comm = allowed[0];
    } else {
      // Check groups
      if (!groups.find(g => comm.group.match(new RegExp(`^${g}(\\.[\\w._-]+)?$`)))) {
        throw new Error(`the command group \`${comm.group}\` is not enabled on this server`);
      }
    }

    // Check permission level
    if (comm.permission > permLevel) {
      throw new Error(`you do not have the correct permissions for \`${prefix}${commName}\``);
    }

    return comm;
  }

  listCommands(message, group, useObj = false) {
    if (message) {
      let groups = this.conf.default.always.slice();
      groups.push('core');
      let permLevel = Command.PermissionLevels.DEFAULT;

      // Get any server specific command groups
      if (message.channel instanceof Discord.TextChannel) {
        let servConf = this.getConfig(message.guild);
        if (servConf) {
          if (servConf.addons) {
            groups.unshift(...servConf.addons);
          }
        }

        permLevel = this.getPermissionLevel(message);
        groups.push(message.channel.guild.id);
      } else {
        groups.unshift(...this.conf.default.addons);
      }

      if (group) {
        if (group === 'this') {
          group = message.channel.guild.id;
        }

        if (groups.find(g => group.match(new RegExp(`^${g}(\\.[\\w._-]+)?$`)))) {
          groups = [group];
        } else {
          return [];
        }
      }

      let conflicts = [];
      let commands = Array.from(this.commands.entries())
        .filter((pair) => {
          let command = pair[1];
          // Multiple commands with this trigger, check each of them
          if (Array.isArray(command)) {
            // Find command with matching group
            let res = command.filter(c => groups.find(g => c.group.match(new RegExp(`^${g}(\\.[\\w._-]+)?$`))));

            if (res.length === 1) {
              // Check permission
              if (permLevel < res[0].permission) {
                return false;
              }
              return groups.find(g => res[0].group.match(new RegExp(`^${g}(\\.[\\w._-]+)?$`)));
            }

            res.forEach((comm) => {
              // Check permission
              if (permLevel < comm.permission) {
                return;
              }
              conflicts.push([pair[0], comm]);
            });

            return false;
          }
          // Only one
          else {
            // Check permission
            if (permLevel < command.permission) {
              return false;
            }
            return groups.find(g => command.group.match(new RegExp(`^${g}(\\.[\\w._-]+)?$`)));
          }
        });

      if (!useObj) {
        commands = commands.map(pair => pair[0]); // Only want the trigger for the command
        conflicts = conflicts.map(pair => `${pair[1].group}.${pair[0]}`);
      }
      return commands.concat(conflicts);
    } else {
      return Array.from(this.commands.keys());
    }
  }

  getConfig(obj, server) {
    // Requires typechecking to prevent object literals being used to get/set
    // the configuration of other objects
    if (obj instanceof Discord.Guild) {
      return this._getServerConfig(obj);
    } else if (obj instanceof ScriptAddon) {
      if (server === 'default') {
        return this._getDefaultConfig()['addon-conf'][obj.namespace];
      } else {
        return this._getAddonConfig(obj, server);
      }
    } else if (obj === 'default') {
      return this._getDefaultConfig();
    }

    throw 'invalid object, can not get config';
  }

  setConfig(obj, conf, server) {
    if (obj instanceof Discord.Guild) {
      return this._setServerConfig(obj, conf);
    } else if (obj instanceof ScriptAddon) {
      return this._setAddonConfig(obj, conf, server);
    } else if (obj === 'default') {
      return this._setDefaultConfig(conf);
    }

    throw 'invalid object, can not set config';
  }

  requestAllMessages(func, processed = null) {
    this.allM.push({func, processed});
  }

  cancelAllMessages(func) {
    let index = this.allM.indexOf(func);
    if (index > -1) {
      this.allM.splice(index, 1);
    }
  }

  getPermissionLevel(message) {
    let channel = message.channel;
    let user = message.author;
    // DM channels always have default perms, even for overlords
    if (!channel instanceof Discord.TextChannel) {
      return Command.PermissionLevels.DEFAULT;
    }

    if (this.conf.overlords) {
      if (this.conf.overlords.includes(user.id)) {
        return Command.PermissionLevels.OVERLORD;
      }
    }

    let perms = channel.permissionsFor(user);
    if (perms && perms.hasPermission('MANAGE_GUILD')) {
      return Command.PermissionLevels.ADMIN;
    }

    return Command.PermissionLevels.DEFAULT;
  }

  send(target, message, error = false) {
    // TODO: Check whether s_b can actually use embeds
    let embed;
    let text = '';
    let isEmbed = false;
    if (message instanceof Discord.RichEmbed) {
      embed = message;
      isEmbed = true;

      if (message.title) {
        text = message.title;
      } else if (message.description) {
        text = message.description;
      }
    } else {
      embed = this.embedify(message);
      text = message;
    }

    if (error) {
      embed.setColor(this.conf.default.color.error);
    }

    console.log(`<${isEmbed?' {embed} ':' '}${text}`); // eslint-disable-line no-console

    return target.sendEmbed(
      embed,
      '',
      { disableEveryone: true }
    );
  }

  embedify(message) {
    const embed = new Discord.RichEmbed();
    //  .setAuthor('\u200b', this._discord.user.avatarURL);

    // Set embed colour
    if (this.conf.default.color) {
      embed.setColor(this.conf.default.color.normal);
    }

    // See if message is a link
    // TODO: Possibly
    // Basic url matching regex
    let urlRegex = /(https?:\/\/(?:\w+\.?)+\/?\S*\.(?:jpe?g|png|gif(?!v)))/g;
    let match = message.match(urlRegex);
    if (match) {
      // Use last image in message
      let last = match[match.length - 1];
      embed.setImage(last);

      // If the message more than just that link, put entire message in description
      if (message !== last) {
        // If only message, remove the link
        if (match.length === 1) {
          message = message.replace(match[0], '');
        }
        embed.setDescription(message);
      }
    } else {
      embed.setDescription(message);
    }

    return embed;
  }

  log(message, from = this, error = false) {
    let id;
    if (from instanceof Bot) {
      id = 'BOT';
    } else if (from instanceof Addon) {
      id = from.namespace;
    } else if (typeof from === 'string') {
      id = from;
    }

    let out = `[${id}] ${message}`;
    if (error) {
      out = `[ERROR]${out}`;
      console.error(out); // eslint-disable-line no-console
    } else {
      console.log(out); // eslint-disable-line no-console
    }
    return out;
  }

  error(message, from) {
    return this.log(message, from, true);
  }

  logWrite(message, from = this, error = false) {
    // TODO: add message to log file
  }

  //endregion

  //region Private Functions

  _listDirectory(path) {
    return new Promise((resolve, reject) => {
      fs.readdir(path, (err, data) => {
        if (err) {
          this.error(`unable to read directory ${path}`);
          reject(err);
          return;
        }

        resolve(data);
      });
    });
  }

  _loadConfig(files) {
    let promises = files.map(file => new Promise((resolve, reject) => {
      this.log(`Loading config ${file}`);
      try {
        // Create JSONAddons for .json files'
        let match = file.match(/^(.*)\.conf\.json$/);
        if (match) {
          fs.readFile(`./${this.conf.paths.conf}${file}`, 'utf8', (err, data) => {
            if (err) {
              this.error(`${file} read error: ${err}`);
              resolve();
              return;
            }
            resolve({
              name: match[1],
              data: JSON.parse(data)
            });
          });
        }
        // Default message
        else {
          this.error(`${file} is not a valid filetype for configs. must be \`*.conf.json\``);
          resolve();
        }
      } catch (e) {
        this.error(`${file}: ${e}`);
        resolve();
        return;
      }
    }));
    return Promise.all(promises)
      .then(ps => ps.filter(p => p)); // Eliminates the undefined configs
  }

  _initConfig(configs) {
    configs.forEach((conf) => {
      this.serverConf.set(conf.name, conf.data);
    });
    return configs;
  }

  _getDefaultConfig() {
    return this.serverConf.get('default');
  }

  _getServerConfig(server) {
    if (!this.serverConf.has(server.id)) {
      this.serverConf.set(server.id, this._newServerConf(server));
      this._writeServerConf(server)
        .catch(() => {});
    }
    return this.serverConf.get(server.id);
  }

  _getAddonConfig(addon, server) {
    if (server) {
      return this.getConfig(server)['addon-conf'][addon.namespace];
    }

    return Array.from(this.serverConf.entries())
      .reduce((obj, pair) => {
        if (pair[1]['addon-conf'][addon.namespace]) {
          obj[pair[0]] = pair[1]['addon-conf'][addon.namespace];
        }
        return obj;
      }, {});
  }

  _setDefaultConfig(conf) {
    this.serverConf.set('default', conf);

    return this._writeServerConf({id: 'default'});
  }

  _setServerConfig(server, conf) {
    this.serverConf.set(server.id, conf);

    return this._writeServerConf(server);
  }

  _setAddonConfig(addon, conf, server) {
    if (server) {
      let serverConf = this.getConfig(server);
      serverConf['addon-conf'][addon.namespace] = conf;

      return this._writeServerConf(server);
    }

    let promises = Object.keys(conf)
      .map((s) => {
        let serverConf = this.getConfig(s);
        serverConf['addon-conf'][addon.namespace] = conf;

        return this._writeServerConf(s);
      });

    return Promise.all(promises);
  }

  _writeServerConf(server) {
    return new Promise((resolve, reject) => {
      let conf = this.serverConf.get(server.id);

      fs.writeFile(
        `${this.conf.paths.conf}${server.id}.conf.json`,
        JSON.stringify(conf, null, 2),
        (err) => {
          if (err) {
            reject(err);
            this.error(`unable to write ${server.id}.conf.json`);
            return;
          }
          resolve();
        });
    });
  }

  _newServerConf(guild) {
    let defaultConf = this.getConfig('default');
    return {
      name: guild.name,
      prefix: defaultConf.prefix,
      color: defaultConf.color,
      addons: defaultConf.addons.slice(),
      'addon-conf': {}
    };
  }

  _createAddons(files) {
    let promises = files.map(file => new Promise((resolve, reject) => {
      this.log(`Creating addon ${file}`);
      let AddonModule;
      try {
        // Create JSONAddons for .json files
        if (file.match(/\.json$/)) {
          fs.readFile(`./${this.conf.paths.addons}${file}`, 'utf8', (err, data) => {
            let addon = new JSONAddon(this, JSON.parse(data), file);
            this.addons.push(addon);
            resolve(addon);
          });
        }
        // Just require .js files
        else if (file.match(/\.js$/)) {
          AddonModule = require(`../${this.conf.paths.addons}${file}`);
          let addon = new AddonModule(this);
          this.addons.push(addon);
          resolve(addon);
        }
        // Default message
        else {
          this.error(`Failed to create addon: ${file}, not a valid filetype`);
          resolve();
        }
      } catch (e) {
        this.error(`${file}: ${e}`);
        resolve();
        return;
      }
    }));
    return Promise.all(promises)
      .then(ps => ps.filter(p => p)); // Eliminates the undefined addons
  }

  _initAddons(addons) {
    let promises = addons.map(addon => addon.init());
    return Promise.all(promises);
  }

  _deinitAddons(addons) {
    let promises = addons.map(addon => addon.deinit());
    return Promise.all(promises);
  }

  _openConnections() {
    this._discord.on('message', this._onMessage.bind(this));
    this.log('Logging in', 'djs');
    return this._discord.login(this.conf.login.token)
      .then(() => {
        this.log('Logged in', 'djs');
      });
  }

  _closeConnections() {
    return Promise.resolve();
  }

  _newConfig(obj) {
    let def = this.conf.default;
    if (obj instanceof Discord.Guild) {
      return {
        name: obj.name,
        prefix: def.prefix,
        addons: def.addons.slice()
      };
    }
  }

  _allHandlers(message, processed = false) {
    // Send all incoming messages to addons that ask for them
    setImmediate(() => {
      this.allM.forEach((handler) => {
        // Is handler fussy?
        if (handler.processed !== null) {
          // If handler wants only processed
          if (handler.processed && processed) {
            handler.func(message, processed);
          } else
          // If handler only wants non-processed
          if (!handler.processed && !processed) {
            handler.func(message, processed);
          }
        } else {
          handler.func(message, processed);
        }
      });
    });
  }

  _onMessage(message) {
    let inputProm = new Promise((resolve, reject) => {

      if (this.conf.dev && this.conf.dev.server) {
        if (message.channel instanceof Discord.TextChannel) {
          if (message.guild.id === this.conf.dev.server) {
            if (this.conf.dev.channel && (this.conf.dev.channel !== message.channel.id)) {
              return;
            }
          } else {
            return;
          }
        } else {
          return;
        }
      }

      if (this.conf.verbose) {
        if (!(message.author.id === this._discord.user.id)) {
          console.log(`> ${message.author.username}: ${message.content}`); // eslint-disable-line no-console
        }
      }

      if (message.channel instanceof Discord.TextChannel) {
        let sConf = this.getConfig(message.guild);
        if (sConf.filter && sConf.filter.length && sConf.filter.indexOf(message.channel.id) === -1) {
          return;
        }
      }

      if (message.author.bot) {
        return;
      }

      let first = message.content.split(' ')[0];
      let comm;

      // Prevent triggering of markdown strikethrough
      let strikethrough = false;
      if (first.match(/^~~/)) {
        strikethrough = true;
      }

      try {
        comm = this.getCommand(first, message);
      } catch (e) {
        if (!strikethrough) {
          reject(e);
          return;
        }
      }

      if (!comm) {
        // Send command to listeners that want all messages
        this._allHandlers(message, false);

        if (!message.channel instanceof Discord.TextChannel) {
          reject(new Error('the first word of a message must be a valid command'));
        }
        return;
      }

      let input = new Input(message, this);
      resolve(input);
    });

    return inputProm
      .then(i => i.process())
      .catch((err) => {
        if (err) {
          let errMess;
          if (typeof err === 'string') {
            errMess = err;
          } else if (err instanceof Error) {
            if (err.message.match('Forbidden')) {
              errMess = 'secret_bot does not have the right permissions to be able to run the command';
            } else {
              errMess = err.message;
            }
          }

          this.send(message.author, errMess, true);

          if (this.conf.verbose) {
            console.error(err); // eslint-disable-line no-console
          }
        }
      })
      .then((result) => {
        if (result) {
          return this.send(message.channel, result);
        }
      })
      .catch((err) => {
        if (err) {
          if (err.message.match('Forbidden')) {
            this.send(message.author, this.embedify('secret_bot was unable to reply. are they blocked from sending messages?'), true);
          }

          if (this.conf.verbose) {
            this.error(err);
          }
        }
      })
      .then(() => {
        // Send command to listeners that want all messages
        this._allHandlers(message, true);
      });
  }

  //endregion

}

module.exports = Bot;
