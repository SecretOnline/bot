'use strict';
var fs = require('fs');

var Command = require('./Command.js');
var Input = require('./Input.js');
var Discordie = require('discordie');

var addonList = [];

class Bot {
  constructor(discord, config) {
    this.commands = new Map();
    this.d = discord;
    this.conf = config;


    this.addListeners();

    this.servers = JSON.parse(fs.readFileSync(config.files.servers));

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
  }

  get Command() {
    return Command;
  }

  get Input() {
    return Input;
  }

  get discord() {
    return this.d;
  }

  getServerConf(id) {
    return this.servers[id];
  }

  setServerConf(id, conf) {
    this.servers[id] = conf;
    fs.writeFile(this.conf.files.servers, JSON.stringify(this.servers, null, 2));
  }

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

  stop() {
    this.d.disconnect();

    if (this.conf.reconnect) {
      this.d.Dispatcher.off('DISCONNECTED', this.reconnect);
    }
  }

  reconnect(event) {
    console.log(`[LOGIN] Disconnected: ${event.error.message}`);

    this.start();
  }

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

  registerCommand(trigger, comm) {
    if (this.commands.has(trigger)) {
      return false;
    } else {
      this.commands.set(trigger, comm);
      return true;
    }
  }

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

  commandList(message) {
    if (message) {
      let server = message.guild.id;
      this.servers[server] = this.servers[server] || {};
      let allowedGroups = this.servers[server].groups || [];
      return Array.from(this.commands.entries())
        .filter((pair) => {
          let trigger = pair[0];
          let command = pair[1];

          return command.group === `custom-${message.guild.id}` || allowedGroups.indexOf(command.group) > -1;
        })
        .map((pair) => {
          return pair[0];
        });
    } else {
      return Array.from(this.commands.keys());
    }
  }

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
