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
      // TODO: Add support for commands with same trigger from different groups
      return false;
    } else {
      this.commands.set(trigger, command);
      return true;
    }
  }

  removeCommand(trigger, command) {
    var comm = this.commands.get(trigger);

    if (comm) {
      if (comm === command) {
        this.commands.delete(trigger);
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  }

  addServer(server) {
    let id = server.botId;
    if ((!id) || (this.servers.has(id))) {
      id = Math.floor(Math.random() * 1000000);

      while (this.servers.has(id)) {
        id = Math.floor(Math.random() * 1000000);
      }
      server.botId = id;
    }

    this.servers.set(id, server);

    return id;
  }

  removeServer(id) {
    if (this.servers.has(id)) {
      this.servers.remove(id);
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

    let groups = this.c.default.addons;
    let prefix = this.c.default.prefix;
    let permLevel = Command.PermissionLevels.DEFAULT;

    // Add other groups into list for channel
    if (message.channel instanceof Channel) {
      let connConf = this.c.connections[message.channel.connection.id] || {};
      let servConf = connConf[message.channel.server.botId];
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
      // Get the user's actual permission level for this channel
      permLevel = message.user.getPermissionLevel(message.channel);
    }

    // Actually make sure this is a command
    // (yes, we neded to get this far before we could check)
    let match = trigger.match(new RegExp(`^${prefix}(.+)`));
    if (!match) {
      return false;
    }

    // Actually get the command
    // TODO: Handle arrays
    // TODO: Handle group.trigger style
    let comm = this.commands.get(match[1]);
    if (!comm) {
      return false;
    }

    // Check permission level
    if (comm.permission > permLevel) {
      return false;
    }
    // Check groups
    if (!groups.includes(comm.group)) {
      console.log(comm.group);
      return false;
    }

    return comm;
  }

  listCommands(context, group) {
    if (context) {
      let groups = this.c.default.addons;

      // Get any server specific command groups
      if (context instanceof Channel) {
        let connConf = this.c.connections[context.connection.id] || {};
        let servConf = connConf[context.server.botId];
        if (servConf) {
          if (servConf.addons) {
            groups.unshift(...servConf.addons);
          }
        }
      }

      return Array.from(this.commands.entries())
        .filter((pair) => {
          let command = pair[1];

          // Only list commands for one group
          if (group) {
            // Multiple commands with this trigger, check each of them
            if (Array.isArray(command)) {
              // Find command with matching group, if not found, exit early
              let res = command.find(comm => comm.group === group);
              if (!res) {
                return false;
              }
            }
            // Only one
            else if (command.group !== group) {
              return false;
            }
          }
          // List commands for all groups in context
          else {
            // Multiple commands with this trigger, check each of them
            if (Array.isArray(command)) {
              // Find command with matching group
              return command.find(comm => groups.includes(comm.group));
            }
            // Only one
            else {
              return groups.includes(command.group);
            }
          }
        })
        .map(pair => pair[0]); // Only want the trigger for the command
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
          let addon = new AddonModule(this, {});
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

    if (message.channel instanceof Channel && (!this.servers.has(message.channel.server.botId))) {
      console.error(`[ERROR] no server with id ${message.channel.server.botId}`);
    }

    if (!message.isBot) {
      let prefix = this.c.default.prefix;
      try {
        prefix = this.c.connections[message.connection.id].servers[message.server.id].prefix;
      } catch (e) {} // Just ignore errors for now
      if (!message.text.match(new RegExp(`^${prefix}(.+)`))) {
        return;
      }

      let input = new Input(message, this);
      input.process()
        .catch((err) => {
          console.error('[ERROR] processing command');
          if (this.c.verbose) {
            console.error(err.stack);
          }

          if (typeof err === 'string') {
            message.user.send(err);
          } else {
            if (message.user.getPermissionLevel(message.channel) > 1) {
              message.user.send(err);
            }
          }
        })
        .then((result) => {
          if (result) {
            message.channel.send(result);
          }
        });
    }
  }

  //endregion

}

module.exports = Bot;
