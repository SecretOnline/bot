/* eslint no-console: 0 */

const fs = require('fs');
const JSONAddon = require('./JSONAddon.js');
const ScriptAddon = require('./ScriptAddon.js');
const Connection = require('./Connection.js');
const Command = require('./Command.js');
const Channel = require('./Channel.js');
const Input = require('./Input.js');
const Message = require('./Message.js');
const User = require('./User.js');
const Server = require('./Server.js');

class Bot {
  constructor(confPath) {
    this.c = require(`../${confPath}`);
    this.confPath = confPath;

    this.commands = new Map();
    this.servers = new Map();
    this.connections = [];
    this.addons = [];
  }

  //region Functions

  start() {
    return this.reloadConnections()
      .then(this.reloadAddons.bind(this))
      .then(() => {
        console.log('[BOT] Loading complete');
      });
  }

  stop() {

  }

  reloadAddons() {
    return this._deinitAddons(this.addons)
      .catch((err) => {
        console.error('Error while trying to deinit addons');
        console.error(err);
      })
      .then(() => {
        return this._listDirectory(this.c.paths.addons)
          .then(this._createAddons.bind(this))
          .then(this._initAddons.bind(this));
      });
  }

  reloadConnections() {
    console.log('[BOT] loading connections');
    return this._listDirectory(this.c.paths.connections)
      .then(this._createConnections.bind(this))
      .then(this._openConnections.bind(this));
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

    let groups = this.c.default.addons.slice();
    let prefix = this.c.default.prefix;
    let permLevel = Command.PermissionLevels.DEFAULT;

    // Add other groups into list for channel
    if (message.channel instanceof Channel) {
      let connConf = this.c.connections[message.channel.connection.id] || {};
      let servConf = connConf.servers[message.channel.server.id];
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
      groups.push(`${message.channel.connection.id}.${message.channel.server.id}`);
      // Get the user's actual permission level for this channel
      permLevel = message.user.getPermissionLevel(message.channel);
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
      if (!groups.includes(match[1])) {
        return false;
      }

      // Filter to only the specified group
      groups = [match[1]];
      commName = match[2];
    }

    // Actually get the command
    let comm = this.commands.get(commName);
    if (!comm) {
      return false;
    }

    // Handle the array case
    if (Array.isArray(comm)) {
      let allowed = comm.filter(c => groups.includes(c.group));
      // Maybe in the future give a message saying that there was a conflict
      if (allowed.length !== 1) {
        return false;
      }
      comm = allowed[0];
    }

    // Check permission level
    if (comm.permission > permLevel) {
      return false;
    }
    // Check groups
    if (!groups.includes(comm.group)) {
      return false;
    }

    return comm;
  }

  listCommands(message, group) {
    if (message) {
      let groups = this.c.default.addons.slice();

      // Get any server specific command groups
      if (message.channel instanceof Channel) {
        let servConf = context.server.getConfig();
        if (servConf) {
          if (servConf.addons) {
            groups.unshift(...servConf.addons);
          }
        }
      }

      if (group) {
        if (groups.includes(group)) {
          groups = [group];
        } else {
          return [];
        }
      }

      let conflicts = [];
      return Array.from(this.commands.entries())
        .filter((pair) => {
          let command = pair[1];
          // Multiple commands with this trigger, check each of them
          if (Array.isArray(command)) {
            // Find command with matching group
            let res = command.filter(comm => groups.includes(comm.group));

            if (res.length === 1) {
              // Check permission
              if (message.user.getPermissionLevel(message.channel) < res[0].permission) {
                return false;
              }
              return groups.includes(res[0].group);
            }

            res.forEach((comm) => {
              // Check permission
              if (message.user.getPermissionLevel(message.channel) < comm.permission) {
                return;
              }
              conflicts.push([pair[0], comm]);
            });

            return false;
          }
          // Only one
          else {
            // Check permission
            if (message.user.getPermissionLevel(message.channel) < command.permission) {
              return false;
            }
            return groups.includes(command.group);
          }
        })
        .map(pair => pair[0]) // Only want the trigger for the command
        .concat(conflicts.map(pair => `${pair[1].group}.${pair[0]}`));
    } else {
      return Array.from(this.commands.keys());
    }
  }

  getConfig(obj) {
    // Requires typechecking to prevent object literals being used to get/set
    // the configuration of other objects
    if (obj instanceof Connection) {
      return this.c.connections[obj.id] || {};
    } else if (obj instanceof ScriptAddon) {
      return this.c.addons[obj.namespace] || {};
    } else if (obj === 'default') {
      return this.c.default;
    }
  }

  setConfig(obj, conf) {
    let changed = false;

    if (obj instanceof Connection) {
      this.c.connections[obj.id] = conf;
      changed = true;
    } else if (obj instanceof ScriptAddon) {
      this.c.addons[obj.namespace] = conf;
      changed = true;
    } else if (obj === 'default') {
      this.c.default = conf;
      changed = true;
    }

    if (changed) {
      fs.writeFile(this.confPath, JSON.stringify(this.c, null, 2));
    }
  }

  //endregion

  //region Private Functions

  _listDirectory(path) {
    return new Promise((resolve, reject) => {
      fs.readdir(path, (err, data) => {
        if (err) {
          console.error(err);
          reject(err);
          return;
        }

        resolve(data);
      });
    });
  }

  _createAddons(files) {
    let promises = files.map(file => new Promise((resolve, reject) => {
      console.log(`[BOT] Creating addon ${file}`);
      let AddonModule;
      try {
        // Create JSONAddons for .json files
        if (file.match(/\.json$/)) {
          fs.readFile(`./${this.c.paths.addons}${file}`, 'utf8', (err, data) => {
            let addon = new JSONAddon(this, JSON.parse(data), file);
            this.addons.push(addon);
            resolve(addon);
          });
        }
        // Just require .js files
        else if (file.match(/\.js$/)) {
          AddonModule = require(`../${this.c.paths.addons}${file}`);
          let addon = new AddonModule(this);
          this.addons.push(addon);
          resolve(addon);
        }
        // Default message
        else {
          console.error(`[BOT] Failed to create addon: ${file}, not a valid filetype`);
          resolve();
        }
      } catch (e) {
        console.error(`[BOT] Failed to create addon: ${file}`);
        console.error(e);
        resolve();
        return;
      }
    }));
    return Promise.all(promises);
  }

  _initAddons(addons) {
    let promises = addons.map(addon => addon.init());
    return Promise.all(promises);
  }

  _deinitAddons(addons) {
    let promises = addons.map(addon => addon.deinit());
    return Promise.all(promises);
  }

  _createConnections(files) {
    let promises = files.map(file => new Promise((resolve, reject) => {
      console.log(`[BOT] Creating connection ${file}`);
      let ConnectionModule;
      try {
        ConnectionModule = require(`../${this.c.paths.connections}${file}`);
        let conn = new ConnectionModule(this, {});
        this.connections.push(conn);
        resolve(conn);
      } catch (e) {
        console.error(`[BOT] Failed to create connection: ${file}`);
        console.error(e);
        resolve();
        return;
      }
    }));
    return Promise.all(promises);
  }

  _openConnections(connections) {
    let promises = connections.map(conn => conn.open());
    connections.forEach(conn => {
      conn.on('message', this._onMessage.bind(this));
    });
    return Promise.all(promises);
  }

  _closeConnections(connections) {
    let promises = connections.map(conn => conn.close());
    return Promise.all(promises);
  }

  _onMessage(message) {
    //TODO: Send all incoming messages to addons that want all messages

    if (this.c.verbose) {
      console.log(`${message.user.name}: ${message.text}`);
    }

    if (!message.isBot) {
      var first = message.text.split(' ')[0];
      if (!this.getCommand(first, message)) {
        if (message.channel instanceof User) {
          message.user.send('sorry, i didn\'t recognise a command at the beginning of your message. the prefix for commands in private messages is a tilde `~`, e.g. `~help`');
        }
        return;
      }

      let input = new Input(message, this);
      input.process()
        .then((result) => {
          if (result) {
            message.channel.send(result);
          }
        }, (err) => {
          if (err) {
            if (typeof err === 'string') {
              message.user.send(err);
            }

            if (this.c.verbose) {
              console.error(err);
            }
          }
        });
    }
  }

  //endregion

}

module.exports = Bot;
