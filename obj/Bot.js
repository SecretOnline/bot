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
    this.watching = new Map();
    this.points = {};
    this.servers = {};

    // Reloading of server configs
    this.watchFile(config.files.servers, (data) => {
      this.servers = JSON.parse(data);
      if (this.conf.verbose) {
        console.log('[INFO] reloaded server config');
      }
    });

    // Reloading of points
    this.watchFile(config.files.points, (data) => {
      this.points = JSON.parse(data);
      if (this.conf.verbose) {
        console.log('[INFO] reloaded points');
      }
    });

    // Let's get going
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
    var conn = () => {
      this.d.connect({
        token: this.conf.token,
        reconnect: this.conf.reconnect
      });
    };

    conn();

    this.forceReload();

    // Because event listeners...
    let bot = this;

    this.d.Dispatcher.on('GATEWAY_READY', (event) => {
      console.log(`[LOGIN] Logged in as ${this.d.User.username}`);
    });

    this.d.Dispatcher.once('GATEWAY_READY', (event) => {
      // Do postinit of addons
      addonList.forEach((item) => {
        if (item) {
          if (typeof item.postinit === 'function') {
            try {
              item.postinit(bot);
            } catch (e) {
              console.error(`error during postinit`);
              console.error(e);
            }
          }
        }
      });
    });

    this.d.Dispatcher.on('DISCONNECTED', (err) => {
      console.log(`[LOGIN] Disconnected: ${err}`);
      conn();
    });
  }

  /**
   * Stops the bot
   */
  stop() {
    this.d.disconnect();
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

          // Do init of addons
          addonList.forEach((item) => {
            if (item) {
              if (typeof item.init === 'function') {
                try {
                  item.init(this);
                } catch (e) {
                  console.error(`error during init`);
                  console.error(e);
                }
              }
            }
          });

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

        console.log(`loaded ${filename}`);
        resolve(mod);
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
      // Get list of groups alowed by server
      let server = message.guild.id;
      this.servers[server] = this.servers[server] || {};
      let allowedGroups = this.servers[server].groups || [];

      // Find matching commands
      return Array.from(this.commands.entries())
        .filter((pair) => {
          let trigger = pair[0];
          let command = pair[1];

          // If group was given, filter by group
          if (group && command.group !== group) {
            return false;
          }

          // Check command groups
          return command.group === `custom-${message.guild.id}` || allowedGroups.indexOf(command.group) > -1;
        })
        .map((pair) => {
          // Return the trigger
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
        // Create new entry in servers
        this.servers[event.message.guild.id] = Object.assign({}, this.servers._default);
        this.servers[event.message.guild.id].name = event.message.guild.name;
        // This will trigger a filechange evnt, so srver config gets reloaded again
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

            if (typeof err === 'string') {
              this.sendToUser(err, event.message.author);
            } else {
              if (this.conf.overlords.indexOf(event.message.author.id) > -1) {
                this.sendToUser(err, event.message.author);
              }
            }
          })
          .then((result) => {
            if (result) {
              if (event.message.channel) {
                event.message.channel.sendMessage(result)
                  .then(() => {
                    if (this.conf.verbose) {
                      console.log(`<- ${result}`);
                    }
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
   */
  sendToUser(text, user) {
    user.openDM()
      .then((channel) => {
        channel.sendMessage(text);
        console.log(`<= (@${user.username}): ${text}`);
      }, (err) => {
        console.error(`unable to open a dm channel to ${user.username}`);
      });
  }

  /**
   * Sends a mesage to the channel
   * @param  {string}   text    Message to send
   * @param  {IChannel} channel Channel to send to
   */
  sendToChannel(text, channel) {
    channel.sendMessage(text);
    console.log(`<= (#${channel.name}): ${text}`);
  }

  /**
   * Watches a file for changes, and runs the callback when that happens
   * @param  {string}   file     File to watch
   * @param  {function} callback Function to call when file changes
   */
  watchFile(file, callback) {
    if (this.watching.has(file)) {
      // Add callback to existing watcher
      let watch = this.watching.get(file);
      watch.callbacks.push(callback);
    } else {
      // Create new watcher
      let watch = {
        watcher: undefined,
        callbacks: [
          callback
        ]
      };

      // Watch file
      watch.watcher = fs.watch(file, (event, filename) => {
        if (event === 'change') {
          fs.readFile(file, (err, data) => {
            // Check for errors first
            if (err) {
              console.error(`[ERROR] error trying to read ${file}`);
              if (this.conf.verbose) {
                console.error(err.stack);
              }
              return;
            }
            // Run callbacks
            watch.callbacks.forEach((cb) => {
              try {
                cb(data);
              } catch (e) {
                console.error(`[ERROR] uncaught exception in callback for ${file}`);
              }
            });
          });
        }
      });

      this.watching.set(file, watch);
    }

    // Do first read
    fs.readFile(file, (err, data) => {
      if (err) {
        console.error(`[ERROR] error trying to read ${file}`);
        if (this.conf.verbose) {
          console.error(err.stack);
        }
        return;
      }
      callback(data);
    });
  }

  /**
   * Removes the callback from the watcher
   * @param  {string}   file     File to watch
   * @param  {function} callback Function to remove
   */
  unwatchFile(file, callback) {
    if (this.watching.has(file)) {
      let watch = this.watching.get(file);
      // Remove callback
      watch.callbacks.splice(watch.callbacks.indexOf(callback), 1);
    }
  }

  /**
   * Return the number of points a user has on this server
   * @param  {IUser}  user   User to get points for
   * @param  {IGuild} server Server user is on
   * @return {number}        Number of points
   */
  getPoints(user, server) {
    var uid = user.id;
    var sid = server.id;

    if (this.points[sid]) {
      return this.points[sid][uid] || 0;
    } else {
      return 0;
    }
  }

  /**
   * Sets the user's points
   * @param {IUser} user   User to set points of
   * @param {IGuild} server Server user is on
   * @param {number} points Points to set user to
   */
  setPoints(user, server, points) {
    if (typeof points === 'number') {
      var uid = user.id;
      var sid = server.id;

      if (!this.points[sid]) {
        this.points[sid] = {};
      }
      this.points[sid][uid] = points;

      fs.writeFile(this.conf.files.points, JSON.stringify(this.points, null, 2));
    }
  }
}

module.exports = Bot;
