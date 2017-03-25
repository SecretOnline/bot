const fs = require('fs');

const Discord = require('discord.js');

const Addon = require('./Addon.js');
const JSONAddon = require('./JSONAddon.js');
const ScriptAddon = require('./ScriptAddon.js');
const Command = require('./Command.js');
const Input = require('./Input.js');
const Logger = require('./Logger.js');
const Result = require('./Result.js');

const {promprint, promiseChain, embedify} = require('../util');

const REACTION_POINT_LIMIT = 500;
const REACTION_POINT_INC = 200;

/**
 * The main class of the bot
 * Handles Discord connections, and the creation of addons, as well as the interactions between them
 * 
 * @class Bot
 */
class Bot {
  /**
   * Creates an instance of Bot.
   * 
   * @param {string} confPath Path to the main configuration file
   * 
   * @memberOf Bot
   */
  constructor(confPath) {
    this.conf = require(`../${confPath}`);
    this.confPath = confPath;

    this.serverConf = new Map();
    this.userConf = new Map();

    this.commands = new Map();
    this.addons = new Map();
    this._discord = new Discord.Client();

    this.editCache = new Map();
    this.reactions = new Map();
    this.reactionUsers = new Map();

    this.logger = new Logger(this, this.conf.paths.logs);

    this.reactionUsersInterval = setInterval(() => {
      Array.from(this.reactionUsers.entries()).forEach(([key, value]) => {
        if (value <= 0) {
          this.reactionUsers.delete(key);
        }
        this.reactionUsers.set(key, value - 1);
      });
    }, 1000);
  }

  //region Properties

  /**
   * The Discord.Client this bot uses to connect
   * 
   * @readonly
   * @returns {Discord.Client} Discord Client
   * 
   * @memberOf Bot
   */
  get discord() {
    return this._discord;
  }

  //endregion

  //region Functions

  /**
   * Initialises the bot
   * 
   * @returns {Promise<undefined>} Resolves when the bot has loaded
   * 
   * @memberOf Bot
   */
  start() {
    return Promise.resolve()
      .then(() => {
        // Start logger before anything else starts
        return this.logger.start();
      })
      .then(this.reloadConfig.bind(this))
      .then(this.reloadConnections.bind(this))
      .then(this.reloadAddons.bind(this))
      .then(() => {
        this.log('Loading complete');
      });
  }

  /**
   * Reloads all configuration files for servers 
   * 
   * @returns {Promise<Array>} Resolves when config is reloaded
   * 
   * @memberOf Bot
   */
  reloadConfig() {
    let serverProm = this._listDirectory(this.conf.paths.conf)
      .then(this._loadConfig.bind(this))
      .then(this._initServerConfig.bind(this));
    let userProm = this._listDirectory(this.conf.paths.users)
      .then(this._loadConfig.bind(this))
      .then(this._initUserConfig.bind(this));

    return Promise.all([
      serverProm,
      userProm
    ])
      .then(([servers, users]) => {
        this.log(`loaded configuration for ${servers.length} servers and ${users.length} users`);
      });
  }

  /**
   * Reloads all addons loaded by the bot
   * 
   * @returns {Promise<Array>} Resolves when addons are ready
   * 
   * @memberOf Bot
   */
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
          .then(() => {
            this.log(`loaded ${this.addons.size} addons`);
            this.log(Array.from(this.addons.keys()).join(', '));
            this.log(`${this.commands.size} commands`);
          });
      });
  }

  /**
   * Reconnects to Discord
   * 
   * @returns {Promise<Discord.Client>} Resolves when connected to Discord
   * 
   * @memberOf Bot
   */
  reloadConnections() {
    return this._closeConnections()
      .then(promprint('[BOT] loading connections'))
      .then(this._openConnections.bind(this))
      .then(promprint('[BOT] loaded connections'));
  }

  /**
   * Adds a command to the bot
   * 
   * @param {string} trigger Word that triggers the command
   * @param {Command} command Command to run when triggered
   * @returns {boolean} Whether the command was added
   * 
   * @memberOf Bot
   */
  addCommand(trigger, command) {
    trigger.replace(/\./g, '');
    if (this.commands.has(trigger)) {
      let commands = this.commands.get(trigger);
      if (!Array.isArray(commands)) {
        commands = [commands];
      }

      if (commands.find(c => c.addon === command.addon)) {
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

  /**
   * Removes a command from the bot
   * 
   * @param {string} trigger Trigger for the command
   * @param {string} group Group the command belongs to
   * @returns {boolean} Whether the command was removed
   * 
   * @memberOf Bot
   */
  removeCommand(trigger, addon) {
    var comm = this.commands.get(trigger);

    if (comm) {
      if (Array.isArray(comm)) {
        let command = comm.find(c => c.addon.namespace === addon.namespace);

        if (command) {
          if (command.addon.namespace === addon.namespace) {
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
        if (comm.addon.namespace === addon.namespace) {
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

  /**
   * Gets a Command from the bot
   * 
   * @param {string} trigger Trigger for the command
   * @param {Discord.Message} message Message that triggered the Command lookup
   * @returns {Command} The requested Command
   * 
   * @memberOf Bot
   */
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

    let conf;
    let groups;
    if (message.guild) {
      conf = this.getConfig(message.guild);
      groups = this.listAddons(message.guild);
    } else {
      conf = this.getConfig('default');
      groups = this.listAddons('default');
    }

    let prefix = conf.prefix;
    let permLevel = this.getPermissionLevel(message);

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
        throw `the addon \`${match[1]}\` is not enabled on this server`;
      }

      // Filter to only the specified group
      groups = [match[1]];
      commName = match[2];
    }

    // Actually get the command
    let comm = this.commands.get(commName);
    if (!comm) {
      throw `\`${prefix}${commName}\` is not a valid command`;
    }

    // Handle the array case
    if (Array.isArray(comm)) {
      let allowed = comm.filter(c => groups.find(g => c.addon.namespace.match(new RegExp(`^${g}(\\.[\\w._-]+)?$`))));
      // Maybe in the future give a message saying that there was a conflict
      if (allowed.length > 1) {
        let allowedGroups = allowed.map(c => `\`${c.addon.namespace}\``).join(' ');
        throw `\`${prefix}${commName}\` is added by multiple addons (${allowedGroups}). use \`${prefix}<group>.${commName}\` instead`;
      } else if (allowed.length === 0) {
        throw `\`${prefix}${commName}\` is added by multiple addons, but none of them are enabled`;
      }
      comm = allowed[0];
    } else {
      // Check groups
      if (!groups.find(g => comm.addon.namespace.match(new RegExp(`^${g}(\\.[\\w._-]+)?$`)))) {
        throw `the addon \`${comm.addon.namespace}\` is not enabled on this server`;
      }
    }

    // Check permission level
    if (comm.permission > permLevel) {
      throw `you do not have the correct permissions for \`${prefix}${commName}\``;
    }

    return comm;
  }

  /**
   * Gives a list of all commands usable by the message's author in this location
   * 
   * @param {Discord.Message} message Message to get the context from
   * @param {string} group Command group to filter by
   * @param {boolean} [useObj=false] If set, will return list of trigger/Command pairs instead of just the triggers
   * @returns {(Array<string>|Array<Array>)} Command listing
   * 
   * @memberOf Bot
   */
  listCommands(message, group, useObj = false) {
    if (message) {
      let groups = this.listAddons(message.guild || 'default');
      let permLevel = this.getPermissionLevel(message);

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
            // Find commands with matching group
            let res = command.filter(c => groups.find(g => c.addon.namespace.match(new RegExp(`^${g}(\\.[\\w._-]+)?$`))));

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
            return groups.find(g => command.addon.namespace.match(new RegExp(`^${g}(\\.[\\w._-]+)?$`)));
          }
        });

      if (!useObj) {
        commands = commands.map(pair => pair[0]); // Only want the trigger for the command
        conflicts = conflicts.map(pair => `${pair[1].addon.namespace}.${pair[0]}`);
      }
      return commands.concat(conflicts);
    } else {
      return Array.from(this.commands.keys());
    }
  }

  /**
   * Gives a list of all the addons enabled by a guild
   * 
   * @param {Discord.Message} message
   * @param {boolean} [useObj=false] Whether to return names or the actual addon objects
   * @returns
   * 
   * @memberOf Bot
   */
  listAddons(guild, useObj = false) {
    let enabled = [].concat(
      this.conf['always-enabled'].concat(),
      this.getConfig(guild).addons
    );
    if (guild instanceof Discord.Guild) {
      enabled.push(guild.id);
    }

    let names = enabled.filter(n => this.addons.has(n));
    if (useObj) {
      return names.map(n => this.addons.get(n));
    }
    return names;
  }

  /**
   * Gets the configuration for a given object
   * 
   * @param {(Discord.Guild|ScriptAddon|string)} obj Place to get config for
   * @param {(Discord.Guild|ScriptAddon)} [context] Server to get configuration for. Only used by ScriptAddons
   * @returns {any} Configuration for the object
   * 
   * @memberOf Bot
   */
  getConfig(obj, context) {
    // Requires typechecking to prevent object literals being used to get/set
    // the configuration of other objects
    if (obj instanceof Discord.Guild) {
      return this._getServerConfig(obj);
    } else if (obj instanceof Discord.User) {
      return this._getUserConfig(obj, context);
    } else if (obj instanceof ScriptAddon) {
      if (context === 'default') {
        return this._getDefaultConfig()['addon-conf'][obj.namespace];
      } else {
        return this._getAddonConfig(obj, context);
      }
    } else if (obj === 'default') {
      return this._getDefaultConfig();
    }

    throw 'invalid object, can not get config';
  }

  /**
   * 
   * 
   * @param {(Discord.Guild|ScriptAddon|string)} obj Place to set the config of
   * @param {any} conf Configuration for the object
   * @param {string} [server='default'] Server to set the configuration of. Only used by ScriptAddons
   * @returns {Promise} Resolves when the configuration is writter to disk
   * 
   * @memberOf Bot
   */
  setConfig(obj, conf, context) {
    if (obj instanceof Discord.Guild) {
      return this._setServerConfig(obj, conf);
    } else if (obj instanceof Discord.User) {
      return this._setUserConfig(obj, conf, context);
    } else if (obj instanceof ScriptAddon) {
      if (!context) {
        context = 'default';
      }
      return this._setAddonConfig(obj, conf, context);
    } else if (obj === 'default') {
      return this._setDefaultConfig(conf);
    }

    throw 'invalid object, can not set config';
  }

  /**
   * Gets the permission lever of the Message's author
   * 
   * @param {Discord.Message} message Message to get permission level of
   * @returns {number} Permission level of user
   * 
   * @memberOf Bot
   */
  getPermissionLevel(message) {
    let channel = message.channel;
    let user = message.author;
    // DM channels always have default perms, even for overlords
    if (!(channel instanceof Discord.TextChannel)) {
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

  /**
   * Sends a message to a target
   * 
   * @param {(Discord.Channel|Result)} target Target to send the message to OR Result to be sent
   * @param {(string|Discord.RichEmbed)} message Message to send to the target
   * @param {boolean} [error=false] Whether this message is an error
   * @param {boolean} [disableEveryone=true] Whether @everyone mentions should be disabled
   * @returns
   * 
   * @memberOf Bot
   */
  send(target, message, error = false, disableEveryone = true) {
    // TODO: Check whether s_b can actually use embeds

    if (message instanceof Result) {
      let result = message;
      let functions = [];

      if (result.private && !(target instanceof Discord.User)) {
        return Promise.reject('Private Result is not being sent to a User');
      }

      let textEmbed;
      let textEmbedFunction;
      if (result.text) {
        textEmbed = this.embedify(result.text);
      }

      if (result.reactions.length) {
        if (!textEmbed) {
          textEmbed = new Discord.RichEmbed();
        }

        let desc = result.reactions.map(r => `${r.emoji}: ${r.description}`).join('\n');

        textEmbed.setFooter('you can only use each Action once')
          .setColor(this.conf.color.action)
          .addField('\u200b', desc);

        textEmbedFunction = () => {
          return this.send(target, textEmbed)
            .then((message) => {
              let reactionMap = new Map();
              result.reactions.forEach((reaction) => {
                reactionMap.set(reaction.emojiName, reaction);
              });

              this.reactions.set(message.id, reactionMap);

              // Remove reactions from bot after 10 minutes
              setTimeout(() => {
                this.reactions.delete(message.id);
              }, 10*60*1000);

              return message;
            })
            .then((message) => {
              return promiseChain(result.reactions.map((reaction) => {
                return () => {return message.react(reaction.emoji);};
              }));
            });
        };
      } else {
        textEmbedFunction = () => {return this.send(target, textEmbed);};
      }

      result.embeds.forEach((embed) => {
        functions.push(() => {return this.send(target, embed);});
      });

      if (textEmbed) {
        // If there's text, send this embed first
        // Otherwise, send it last
        if (result.text) {
          functions.unshift(textEmbedFunction);
        } else {
          functions.push(textEmbedFunction);
        }
      }

      if (functions.length) {
        return promiseChain(functions);
      } else {
        return Promise.resolve();
      }
    }

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
      embed.setColor(this.conf.color.error);
    }

    console.log(`<${isEmbed?' {embed} ':' '}${text}`); // eslint-disable-line no-console

    return target.sendEmbed(
      embed,
      '',
      { disableEveryone: true }
    );
  }

  /**
   * Transform a string into an embed
   * 
   * @param {string} message Message to convert
   * @returns {Discord.RichEmbed} Embed to send
   * 
   * @memberOf Bot
   */
  embedify(message, isError) {
    let color = isError ? this.conf.color.error : this.conf.color.normal;
    return embedify(message, color);
  }

  /**
   * Logs a message coming from a location
   * 
   * @param {string} message Message to log
   * @param {(Bot|Addon|string)} [from=this] Place where message is from
   * @param {boolean} [error=false] Whether this message is an error
   * @returns {string} Content that was written to the console
   * 
   * @memberOf Bot
   */
  log(message, from = 'BOT', isError = false) {
    this.logger.log(message, from, isError);
  }

  /**
   * Logs an error coming from a location
   * 
   * @param {string} message Error to log
   * @param {(Bot|Addon|string)} from Place where message is from
   * @returns {string} Content that was written to the console
   * 
   * @memberOf Bot
   */
  error(message, from) {
    return this.log(message, from, true);
  }

  
  getLogs(filter, limit = 80) {
    return this.logger.getLogs(filter, limit);
  }

  //endregion

  //region Private Functions

  /**
   * Lists the files in a directory
   * 
   * @param {string} path Path to list
   * @returns {Promise<Array>} Resolves with a list of files
   * 
   * @memberOf Bot
   */
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

  /**
   * Loads the listed configuration files
   * 
   * @param {Array<string>} files
   * @returns {Promise<Array>} Resolves when all files are loaded
   * 
   * @memberOf Bot
   */
  _loadConfig(files) {
    let promises = files.map(file => new Promise((resolve, reject) => {
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

  /**
   * Stores all server configs into the bot
   * 
   * @param {Array<Object>} configs Set of configurations
   * @returns {Array<Object>} The configuration that was passed in
   * 
   * @memberOf Bot
   */
  _initServerConfig(configs) {
    configs.forEach((conf) => {
      this.serverConf.set(conf.name, conf.data);
    });
    return configs;
  }

  /**
   * Stores all user configs into the bot
   * 
   * @param {Array<Object>} configs Set of configurations
   * @returns {Array<Object>} The configuration that was passed in
   * 
   * @memberOf Bot
   */
  _initUserConfig(configs) {
    configs.forEach((conf) => {
      this.userConf.set(conf.name, conf.data);
    });
    return configs;
  }

  /**
   * Gets the default configuration
   * 
   * @returns {any} Default configuration
   * 
   * @memberOf Bot
   */
  _getDefaultConfig() {
    return this.serverConf.get('default');
  }

  /**
   * Gets the configuration for a server
   * 
   * @param {Discord.Guild} server The id of a server
   * @returns {any} Server configuration
   * 
   * @memberOf Bot
   */
  _getServerConfig(server) {
    if (!this.serverConf.has(server.id)) {
      this.serverConf.set(server.id, this._newServerConf(server));
      this._writeServerConf(server)
        .catch((err) => {
          this.error(err);
        });
    }
    return this.serverConf.get(server.id);
  }

  /**
   * Gets the configuration for an Addon
   * 
   * @param {Addon} addon Addon to get configuration for
   * @param {Discord.Guild} [server] Server to get the configuration from
   * @returns {any} Addon configuration
   * 
   * @memberOf Bot
   */
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

  _getUserConfig(user, addon) {
    let userConf;

    if (this.userConf.has(user.id)) {
      userConf = this.userConf.get(user.id);
    } else {
      userConf = this._newUserConf(user);
      this.userConf.set(user.id, userConf);

      this._writeUserConf(user)
        .catch((err) => {
          this.error(err);
        });
    }

    if (addon && addon instanceof Addon) {
      return userConf['addon-conf'][addon.namespace] || {};
    }

    return userConf;
  }

  /**
   * Sets the default configuration
   * 
   * @param {any} conf Configuration to set
   * @returns {Promise} Resolves when configuration is written to disk
   * 
   * @memberOf Bot
   */
  _setDefaultConfig(conf) {
    this.serverConf.set('default', conf);

    return this._writeServerConf({id: 'default'});
  }

  /**
   * Sets the configuration for a server
   * 
   * @param {Discord.Guild} server Server to set configuration of
   * @param {any} conf Configuration to set
   * @returns {Promise} Resolves when configuration is written to disk
   * 
   * @memberOf Bot
   */
  _setServerConfig(server, conf) {
    this.serverConf.set(server.id, conf);

    return this._writeServerConf(server);
  }

  /**
   * Sets the configuration for an Addon
   * 
   * @param {Addon} addon Addon to set configuration of
   * @param {any} conf Configuration to set
   * @param {Discord.Guild} [server] Server to set configuration of
   * @returns {Promise} Resolves when configuration is written to disk
   * 
   * @memberOf Bot
   */
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

  _setUserConfig(user, conf, addon) {
    if (addon && addon instanceof Addon) {
      let userConf = this.getConfig(user);
      userConf['addon-conf'][addon.namespace] = conf;
    } else {
      this.userConf.set(user.id, conf);
    }

    return this._writeUserConf(user);
  }

  /**
   * Writes configuration for a server to disk
   * 
   * @param {Discord.Guild} server Server to write the configuration of
   * @returns {Promise} Resolves when written
   * 
   * @memberOf Bot
   */
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

  /**
   * Writes configuration for a user to disk
   * 
   * @param {Discord.User} user User to write configuration of
   * @returns {Promise} Resolves when written
   * 
   * @memberOf Bot
   */
  _writeUserConf(user) {
    return new Promise((resolve, reject) => {
      let conf = this.userConf.get(user.id);

      fs.writeFile(
        `${this.conf.paths.users}${user.id}.conf.json`,
        JSON.stringify(conf, null, 2),
        (err) => {
          if (err) {
            reject(err);
            this.error(`unable to write ${user.id}.conf.json`);
            return;
          }
          resolve();
        });
    });
  }

  /**
   * Creates a new configutation for a server
   * 
   * @param {Discord.Guild} guild
   * @returns {Object} New configuration
   * 
   * @memberOf Bot
   */
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

  _newUserConf(user) {
    return {
      name: user.username,
      'addon-conf': {}
    };
  }

  /**
   * Creates Addons from the list of files
   * 
   * @param {Array<string>} files Files to load
   * @returns {Promise<Array>} Resolves when all Addon subclasses have been created
   * 
   * @memberOf Bot
   */
  _createAddons(files) {
    this.log(`creating addons (${files.length})`);
    let functions = files.map((file) => {
      return () => new Promise((resolve, reject) => {
        if (file.match(/\.json$/)) {
          fs.readFile(`./${this.conf.paths.addons}${file}`, 'utf8', (err, data) => {
            if (err) {
              this.error(`Failed to read ${file}`);
              this.error(err);
              resolve();
              return;
            }
            resolve(new JSONAddon(this, JSON.parse(data), file));
          });
        }
        // Just require .js files
        else if (file.match(/\.js$/)) {
          try {
            let AddonModule = require(`../${this.conf.paths.addons}${file}`);
            resolve(new AddonModule(this));
          } catch (err) {
            this.error(`Failed to create addon ${file}`);
            this.error(err);
            resolve();
          }
        }
        // Default message
        else {
          this.error(`${file} is not a valid filetype`);
          resolve();
          return;
        }
      })
        .then((addon) => {
          // Put addon into bot
          if (addon) {
            if (this.addons.has(addon.namespace)) {
              this.error(`Failed to create addon: ${file}, name ${addon.namespace} already exists`);
              return;
            }

            this.addons.set(addon.namespace, addon);
            return addon;
          }
        });
    });

    return promiseChain(functions);
  }

  /**
   * For sneaking an addon into the list
   * Mostly, this will be used by custom commands
   * 
   * @param {Addon} addon
   * 
   * @memberOf Bot
   */
  _sneakAddon(addon) {
    if (this.addons.has(addon.namespace)) {
      this.error(`Failed to add addon: ${addon.namespace}, it already exists`);
      return;
    }

    this.addons.set(addon.namespace, addon);
  }

  _startAddon(addon) {
    let res;
    try {
      res = addon.init();
    } catch (err) {
      res = Promise.reject(err);
    }

    if (res instanceof Promise) {
      return res
        .catch((err) => {
          this.error(`Failed to init addon ${addon.namespace}`);
          this.error(err);
          this.addons.delete(addon.namespace);
        });
    } else {
      return Promise.resolve(res);
    }
  }

  /**
   * Initialises all the addons
   * 
   * @param {Array<Addon>} addons List of addons to initialise
   * @returns {Promise<Array>} Resolves when all Addons have been initialised
   * 
   * @memberOf Bot
   */
  _initAddons() {
    let addons = Array.from(this.addons.values());

    this.log(`initialising addons (${addons.length})`);

    let functions = addons.map((addon) => {
      return () => {
        return this._startAddon(addon);
      };
    });

    return promiseChain(functions);
  }

  /**
   * Shus down all of the addons
   * 
   * @param {Array<Addon>} addons Addons to shut down
   * @returns {Promise<Array>} Resolves when all Addons have stopped
   * 
   * @memberOf Bot
   */
  _deinitAddons(addons) {
    let promises = Array.from(addons.values())
      .map(addon => addon.deinit());
    return Promise.all(promises)
      .then((results) => {
        this.addons.clear();
        return results;
      });
  }

  /**
   * Begins a connection to Discord
   * Here for legacy purposes, since the previous version of bot supported more than just Discord
   * 
   * @returns {Promise<Discord.Client>} Resolves when connected to Discord
   * 
   * @memberOf Bot
   */
  _openConnections() {
    this._discord.on('message', this._onMessage.bind(this));
    this._discord.on('messageUpdate', this._onEdit.bind(this));
    this._discord.on('messageReactionAdd', this._onReactAdd.bind(this));
    this.log('Logging in', 'djs');
    return this._discord.login(this.conf.login.token)
      .then(() => {
        this.log('Logged in', 'djs');
        return this._discord;
      });
  }

  /**
   * Disconnects from Discord
   * DOESN'T ACUTALLY DO ANYTHING
   * 
   * @returns {Promise} Just resolves. Nothing else
   * 
   * @memberOf Bot
   */
  _closeConnections() {
    return Promise.resolve();
  }

  /**
   * Runs a message through listeners for all incoming messages
   * 
   * @param {Discord.Message} message Message to pass around
   * @param {boolean} [processed=false] Whether this message has been processed
   * 
   * @memberOf Bot
   */
  _messageToAddons(message) {
    // Send all incoming messages to addons that ask for them
    setImmediate(() => {
      this.listAddons(message.guild || 'default', true)
        .forEach((addon) => {
          addon.onMessage(message);
        });
    });
  }

  /**
   * Checks to see if the mesage should continue to be processed based on development mode
   * 
   * @param {Discord.Message} message 
   * @returns 
   * 
   * @memberOf Bot
   */
  _checkDevChannel(message) {
    // If a development channel is specified, restrict to just that
    // If dev mode is false, block that channel
    if (this.conf.dev) {
      if (this.conf.dev.enabled) {
        // Block unless in channel
        if (this.conf.dev.channel && (this.conf.dev.channel !== message.channel.id)) {
          return false;
        }
      } else {
        // Block only if in channel
        if (this.conf.dev.channel && (this.conf.dev.channel === message.channel.id)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Whether the bot should process this message
   * 
   * @param {Discord.Message} message Message to test
   * @returns {boolean} Whether this message should be sent
   * 
   * @memberOf Bot
   */
  _shouldProcess(message) {
    // Ignore bot messages
    // Maybe later, allow certain bots to access certain functionality, but for now a full block
    if (message.author.bot) {
      return false;
    }

    let prefix = this.getConfig('default').prefix;
    // Server-only stuff
    if (message.guild) {
      let sConf = this.getConfig(message.guild);
      if (sConf.prefix) {
        prefix = sConf.prefix;
      }

      // Check to see if channel has been blacklisted on server
      if (sConf.filter && sConf.filter.includes(message.channel.id)) {
        return false;
      }

      // Do a strikethrough check
      if (sConf.prefix === '~' && message.content.match(/^~~/)) {
        return false;
      }
    }

    let escapedPrefix = prefix.replace(/[-[\]{}()*+?.,\\/^$|#\s]/g, '\\$&');
    if (!message.content.match(new RegExp(`^${escapedPrefix}`))) {
      return false;
    }

    return true;
  }

  /**
   * Processes an Input
   * Don't use, this is here for testing and experimental purposes
   * 
   * @param {any} input
   * 
   * @memberOf Bot
   */
  _process(input) {
    let message = input.message;
    return input.process()
      // Catch any errors in 
      .catch((err) => {
        if (err) {
          this.editCache.set(message.id, message); // Value stored in map may change
          setTimeout(() => {
            this.editCache.delete(message.id);
          }, 5*60*1000);

          if (typeof err === 'string') {
            let embed = this.embedify(err)
              .setFooter('you can edit your message (once) if you made a mistake');

            this.send(message.author, embed, true);
          } else if (err instanceof Error) {
            this.error(err);
          }
        }
        // Always returns undefined, so the next .then doesn't do anything
      })
      // Send successful result to the origin
      .then((result) => {
        if (result) {
          let target = result.private ? message.author : message.channel;
          this.send(target, result);
        }
      })
      // Catch sending errors
      .catch((err) => {
        if (err) {
          if (this.conf.verbose) {
            this.error('Unable to send reply');
            this.error(err);
          }
        }
      });
  }

  /**
   * Event hamdler for the 'message' event
   * 
   * @param {Discord.Message} message Incoming message
   * @returns {Promise} Resolves once this message has been processed
   * 
   * @memberOf Bot
   */
  _onMessage(message) {
    // Log everything that comes into bot
    this.log(message, message.channel);

    if (!this._checkDevChannel(message)) {
      return;
    }

    this._messageToAddons(message);

    if (!this._shouldProcess(message)) {
      return;
    }

    let input = new Input(message, this);

    return this._process(input);
  }

  /**
   * Event handler for the 'messageUpdate' event
   * 
   * @param {Discord.Message} oldMessage Previous state of the message
   * @param {Discord.Message} newMessage New state of the message
   * @returns {Promise} Resolves once this edit has been processed
   * 
   * @memberOf Bot
   */
  _onEdit(oldMessage, newMessage) {
    if (!this.editCache.has(oldMessage.id)) {
      return;
    }
    if (!newMessage.editedAt) {
      return;
    }

    this.editCache.delete(oldMessage.id);

    // TODO: Run the edited command
    let input = new Input(newMessage, this);

    input.process()
      // Catch any errors in 
      .catch((err) => {
        if (err) {
          // Don't set edit cache
          // Edits only work once

          if (typeof err === 'string') {
            let embed = this.embedify(err)
              .setFooter('edits will no longer work for this message');

            this.send(newMessage.author, embed, true);
          } else if (err instanceof Error) {
            this.error(err);
          }
        }
        // Always returns undefined, so the next .then doesn't do anything
      })
      // Send successful result to the origin
      .then((result) => {
        if (result) {
          let target = result.private ? newMessage.author : newMessage.channel;
          this.send(target, result);
        }
      })
      // Catch sending errors
      .catch((err) => {
        if (err) {
          if (this.conf.verbose) {
            this.error('Unable to send reply');
            this.error(err);
          }
        }
      });
  }


  /**
   * Event handler for the 'messageReactionAdd' event
   * 
   * @param {Discord.MessageReaction} messageReaction
   * @param {Discord.User} user
   * 
   * @memberOf Bot
   */
  _onReactAdd(messageReaction, user) {
    let message = messageReaction.message;
    // Ignore our own reactions
    if (user.id === this.discord.user.id) {
      return;
    }
    if (user.bot) {
      return;
    }

  // Only do stuff for reactions we actually have
    if (this.reactions.has(message.id)) {
      // Check if user has sent too many reactions
      if (message.channel instanceof Discord.TextChannel){
        let value;
        if (this.reactionUsers.has(user.id)) {
          value = this.reactionUsers.get(user.id);
        } else {
          value = 0;
        }

        value += REACTION_POINT_INC;

        this.reactionUsers.set(user.id, value);
      
        if (value > REACTION_POINT_LIMIT) {
          return this.send(user, 'in order to avoid server spamming with Actions, limits have been placed on how often you can use them', true);
        }
      }

      let actions = this.reactions.get(message.id);
      if (!actions) {
        return;
      }

      let reaction = Array.from(actions.values()).find(a => a.emoji === messageReaction.emoji.name);
      if (!reaction) {
        return;
      }

      return reaction.act(user, message.channel);
    }
  }

  //endregion

}

module.exports = Bot;
