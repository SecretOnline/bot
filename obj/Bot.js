'use strict';
var fs = require('fs');

var Command = require('./Command.js');
var Input = require('./Input.js');
var Discordie = require('discordie');

var addonList = [];

/**
 * A bot
 */
class Bot {
  /**
   * Creates a new Bot
   * @param  {Discordie} discord Discord object to link to this bot
   * @param  {Object}    config  Main configuration
   */
  constructor(discord, config) {
    this.commands = new Map();
    this.d = discord;
    this.conf = config;

    // Load server configs
    this.servers = JSON.parse(fs.readFileSync(config.files.servers));
    // Watch servers config file for changes
    fs.watch(config.files.servers, (event, filename) => {
      if (event === 'change') {
        if (config.verbose) {
          console.log('[INFO] reading server configuration');
        }
        fs.readFile(config.files.servers, (err, data) => {
          if (err) {
            console.error(`[Error] reading ${config.files.server}`);
            if (config.verbose) {
              console.error(err.stack);
            } else {
              console.error(err);
            }
            return;
          }

          try {
            this.servers = JSON.parse(data);
          } catch (err) {
            console.error(`[Error] parsing servers ${config.files.server}`);
            if (config.verbose) {
              console.error(err.stack);
            } else {
              console.error(err);
            }
            return;
          }
        });
      }
    });

    this.addListeners();
  }

  /**
   * The Command class
   * @readonly
   */
  get Command() {
    return Command;
  }

  /**
   * The Input class
   * @readonly
   */
  get Input() {
    return Input;
  }

  /**
   * The Discord object linked to this bot
   * @readonly
   * @return {Discordie} Discord connection
   */
  get discord() {
    return this.d;
  }

  /**
   * Returns the config used for a paticular servers
   * @param  {string} id ID of the server
   * @return {Object}    Server's configuration
   */
  getServerConf(id) {
    return this.servers[id] || {};
  }

  /**
   * Sets the configuration of the server
   * @param {string} id   ID of the server
   * @param {Object} conf Server's new configuration
   */
  setServerConf(id, conf) {
    this.servers[id] = conf;
    fs.writeFile(this.conf.files.servers, JSON.stringify(this.servers, null, 2));
  }

  /**
   * Starts the bot
   */
  start() {
    this.d.connect({
      token: this.conf.token
    });

    this.forceReload();

    this.d.Dispatcher.once('GATEWAY_READY', (event) => {
      console.log(`[LOGIN] Logged in as ${this.d.User.username}`);
    });

    if (this.conf.reconnect) {
      this.d.Dispatcher.on('DISCONNECTED', this.reconnect);
    }
  }

  /**
   * Stops the bot
   */
  stop() {
    this.d.disconnect();

    if (this.conf.reconnect) {
      this.d.Dispatcher.off('DISCONNECTED', this.reconnect);
    }
  }

  /**
   * Internal function to restart the bot if it dosconnects
   * @param  {Event} event Disconnect event
   */
  reconnect(event) {
    console.log(`[LOGIN] Disconnected: ${event.error.message}`);

    this.start();
  }

  /**
   * Forces the bot to reload any commands
   * @return {Promise<string,Error>} Resolves with message to print
   */
  forceReload() {
    return new Promise((resolve, reject) => {
      // Do deinit of addons
      addonList.forEach((item) => {
        if (item) {
          if (typeof item.deinit === 'function') {
            try {
              item.deinit();
            } catch (e) {
              console.error(`error during deinit`);
              console.error(e);
            }
          }
        }
      });

      this.commands.clear();


      // Load addons
      fs.readdir('./addons/', (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        var proms = [];
        data.forEach((item) => {
          proms.push(this.loadAddon(item));
        });

        Promise.all(proms).then((addons) => {
          addonList = addons;
          resolve(`reloaded. ${addons.length} addons, ${this.commands.size} commands`);
        }, reject);
      });
    });
  }

  /**
   * Loads a single addon
   * @param  {string}           name name of the file
   * @return {Promise<*,Error>}      Resolves once addon is loaded
   */
  loadAddon(name) {
    return new Promise((resolve, reject) => {
      var filename = `./addons/${name}`;
      var parts = name.split('.');
      var ext = parts.pop();
      var noExt = parts.join('.');
      var mod, obj, keys;

      try {
        delete require.cache[require.resolve(`.${filename}`)];
      } catch (e) {
        console.error(`couldn't remove ${filename} from require cache`);
        if (this.conf.verbose) {
          console.error(e);
        }
      }

      if (ext === 'json') {
        try {
          obj = require.main.require(filename);
        } catch (e) {
          console.error(`error while require-ing ${filename}. continuing`);
          console.error(e);
          console.error(e.stack);
          resolve();
          return;
        }

        keys = Object.keys(obj);
        keys.forEach((key) => {
          var comm = new Command(obj[key], noExt);
          this.registerCommand(key, comm);
        });

        console.log(`loaded ${filename}`);
        resolve(obj);
      } else if (ext === 'js') {
        try {
          mod = require.main.require(filename);
        } catch (e) {
          console.error(`error while require-ing ${filename}. continuing`);
          console.error(e);
          console.error(e.stack);
          resolve();
          return;
        }

        if (mod.init) {
          try {
            var res = mod.init(this);
            if (res instanceof Promise) {
              res.then(() => {
                console.log(`loaded ${filename}`);
                resolve(mod);
              });
            } else {
              console.log(`loaded ${filename}`);
              resolve(mod);
            }
          } catch (e) {
            console.error(`[ERROR] loading ${filename}`);
            console.error(e.stack);
            resolve();
          }
        } else {
          console.log(`${filename} has no init function. is this intended?`);
          resolve(mod);
        }
      } else {
        console.log(`ignoring ${filename}`);
        resolve();
      }
    });
  }

  /**
   * Adds a command to the bot
   * @param  {string}  trigger String to call the commands
   * @param  {command} comm    Command to add
   * @return {boolean}         Success
   */
  registerCommand(trigger, comm) {
    if (this.commands.has(trigger)) {
      return false;
    } else {
      this.commands.set(trigger, comm);
      return true;
    }
  }

  /**
   * Removes a command from the bot
   * @param  {string}  trigger Command identifier
   * @param  {string}  group   Command's group. Used to verify
   * @return {boolean}         Success
   */
  deregisterCommand(trigger, group) {
    var comm = this.commands.get(trigger);

    if (comm) {
      if (group === comm.group) {
        this.commands.delete(trigger);
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  }

  /**
   * Lists the commands available
   * Optionally, list commands available in group
   * @param  {string}        message Discord message
   * @param  {string=}       group   Command group for filtering
   * @return {Array<string>}         List of command triggers
   */
  commandList(message, group) {
    if (message) {
      let server = message.guild.id;
      this.servers[server] = this.servers[server] || {};
      let allowedGroups = this.servers[server].groups || [];
      return Array.from(this.commands.entries())
        .filter((pair) => {
          let trigger = pair[0];
          let command = pair[1];

          if (group && command.group !== group) {
            return false;
          }

          return command.group === `custom-${message.guild.id}` || allowedGroups.indexOf(command.group) > -1;
        })
        .map((pair) => {
          return pair[0];
        });
    } else {
      return Array.from(this.commands.keys());
    }
  }

  /**
   * Internal function to add event listeners for main functionality
   */
  addListeners() {
    this.d.Dispatcher.on('MESSAGE_CREATE', (event) => {
      // Quick exit on self messages
      if (event.message.author.id === this.d.User.id) {
        return;
      }

      // Insta-fail on direct messages
      if (!event.message.guild) {
        return;
      }

      if (!this.servers[event.message.guild.id]) {
        this.servers[event.message.guild.id] = this.servers._default;

        fs.writeFile(this.conf.files.servers, JSON.stringify(this.servers, null, 2));
      }

      var input = new Input(event.message.content, event.message, this);
      if (this.conf.verbose) {
        console.log(`${input.user.username}: ${input.raw}`);
      }

      // TODO: Proper command detection
      var first = input.raw.split(' ')[0];
      if (this.getCommand(first, event.message)) {
        input.process()
          .catch((err) => {
            console.error(`[ERROR] processing command`);
            if (this.conf.verbose) {
              console.error(err.stack);
            }
          })
          .then((result) => {
            if (result) {
              if (event.message.channel) {
                event.message.channel.sendMessage(result)
                  .then(() => {
                    console.log(`<- ${result}`);
                  }, (err) => {
                    console.error(`[ERROR] sending command`);
                    if (this.conf.verbose) {
                      console.error(err.stack);
                    }
                  });
              }
            }
          })
          .catch((err) => {
            console.error(`[ERROR] ${err}`);
          });
      }
    });
  }

  /**
   * Retrieves the wanted command
   * @param  {string}           trigger Command identifier
   * @param  {IMessage}         message Discord message that triggered this request
   * @return {?Command|boolean}         Command, or 'falsey' value
   */
  getCommand(trigger, message) {
    if (typeof trigger === 'string') {
      // TODO: check server-specific command character
      if (trigger.charAt(0) === this.servers[message.guild.id].char) {
        let comm = this.commands.get(trigger.substr(1));
        // Check command actually exists
        if (comm) {
          // Check server allowed groups
          if (comm.group === `custom-${message.guild.id}` || this.servers[message.guild.id].groups.indexOf(comm.group) > -1) {
            // Check for permissions
            if (comm.permission) {
              let userPerm = Command.PermissionLevels.DEFAULT;

              // Check overlords list
              if (this.conf.overlords.indexOf(message.author.id) > -1) {
                userPerm = Command.PermissionLevels.OVERLORD;
                // userPerm = Command.PermissionLevels.DEFAULT;
              } else
              // Check server permissions
              if (message.guild && message.author.can(Discordie.Permissions.General.MANAGE_GUILD, message.guild)) {
                userPerm = Command.PermissionLevels.ADMIN;
              }
              if (userPerm >= comm.permission) {
                return comm;
              } else {
                return false;
              }
            } else {
              return comm;
            }
          } else {
            return false;
          }
        } else {
          return false;
        }
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  /**
   * Sends a message to the user
   * @param  {string}  text Message to send
   * @param  {IUser}   user User to send to
   * @return {Promise}      Resolves upon message sent
   */
  sendToUser(text, user) {
    user.openDM()
      .then((channel) => {
        channel.sendMessage(text);
      }, (err) => {
        console.error(`unable to open a dm channel to ${user.username}`);
      });
  }

}

module.exports = Bot;
