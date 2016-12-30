/* eslint no-console: 0 */

const fs = require('fs');
const JSONAddon = require('./JSONAddon.js');
const ScriptAddon = require('./ScriptAddon.js');
const Connection = require('./Connection.js');
const Command = require('./Command.js');
const Channel = require('./Channel.js');
const Input = require('./Input.js');

class Bot {
  constructor(confPath) {
    this.c = require(`../${confPath}`);
    this.confPath = confPath;

    this.commands = new Map();
    this.connections = [];
    this.addons = [];
    this.allM = [];
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
          .then((files) => {
            if (this.c.dev && this.c.dev.addons) {
              if (this.c.dev.addons.whitelist) {
                return files.filter(a => this.c.dev.addons.whitelist.includes(a));
              }
              if (this.c.dev.addons.blacklist) {
                return files.filter(a => !this.c.dev.addons.blacklist.includes(a));
              }
            }
            // If no filtering occurs, return them all
            return files;
          })
          .then(this._createAddons.bind(this))
          .then(this._initAddons.bind(this))
          .then((arr) => {
            // eslint-disable-next-line no-console
            console.log(`[BOT] loaded ${arr.length} addons`);
            return arr;
          });
      });
  }

  reloadConnections() {
    console.log('[BOT] loading connections');
    return this._listDirectory(this.c.paths.connections)
      .then((files) => {
        if (this.c.dev && this.c.dev.connections) {
          if (this.c.dev.connections.whitelist) {
            return files.filter(a => this.c.dev.connections.whitelist.includes(a));
          }
          if (this.c.dev.connections.blacklist) {
            return files.filter(a => !this.c.dev.connections.blacklist.includes(a));
          }
        }
        // If no filtering occurs, return them all
        return files;
      })
      .then(this._createConnections.bind(this))
      .then(this._openConnections.bind(this))
      .then((arr) => {
        // eslint-disable-next-line no-console
        console.log(`[BOT] loaded ${arr.length} connections`);
        return arr;
      });
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
    groups.push('core');
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
      // `this` is replaced with connection.server
      if (match[1] === 'this') {
        match[1] = `${message.channel.connection.id}.${message.channel.server.id}`;
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

  listCommands(message, group) {
    if (message) {
      let groups = this.c.default.addons.slice();
      groups.push('core');
      let permLevel = Command.PermissionLevels.DEFAULT;

      // Get any server specific command groups
      if (message.channel instanceof Channel) {
        let servConf = message.channel.server.getConfig();
        if (servConf) {
          if (servConf.addons) {
            groups.unshift(...servConf.addons);
          }
        }

        permLevel = message.user.getPermissionLevel(message.channel);
        groups.push(`${message.channel.connection.id}.${message.channel.server.id}`);
      }

      if (group) {
        if (group === 'this') {
          group = `${message.channel.connection.id}.${message.channel.server.id}`;
        }

        if (groups.find(g => group.match(new RegExp(`^${g}(\\.[\\w._-]+)?$`)))) {
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
        })
        .map(pair => pair[0]) // Only want the trigger for the command
        .concat(conflicts.map(pair => `${pair[1].group}.${pair[0]}`));
    } else {
      return Array.from(this.commands.keys());
    }
  }

  getConnection(id) {
    return this.connections.find(conn => conn.id === id);
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

  requestAllMessages(func) {
    this.allM.push(func);
  }

  cancelAllMessages(func) {
    let index = this.allM.indexOf(func);
    if (index > -1) {
      this.allM.splice(index, 1);
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
    return Promise.all(promises)
      .then(ps => ps.filter(p => p)); // Eliminates the undefined connections
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
    let inputProm = new Promise((resolve, reject) => {
      //TODO: Send all incoming messages to addons that want all messages

      // Send all incoming messages to addons that ask for them
      setImmediate(() => {
        this.allM.forEach((func) => {
          func(message);
        });
      });

      if (this.c.verbose) {
        console.log(`${message.user.name}: ${message.text}`);
      }


      if (message.channel instanceof Channel) {
        let sConf = message.channel.server.getConfig();
        if (sConf.filter && sConf.filter.length && sConf.filter.indexOf(message.channel.id) === -1) {
          return;
        }
      }

      if (!message.shouldProcess) {
        return;
      }

      let first = message.text.split(' ')[0];
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
        if (!message.channel instanceof Channel) {
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

          message.user.send(errMess);

          if (this.c.verbose) {
            console.error(err);
          }
        }
      })
      .then((result) => {
        if (result) {
          return message.channel.send(result);
        }
      })
      .catch((err) => {
        if (err) {
          if (err.message.match('Forbidden')) {
            message.user.send('secret_bot was unable to reply. are they blocked from sending messages?');
          }

          if (this.c.verbose) {
            console.error(err);
          }
        }
      });
  }

  //endregion

}

module.exports = Bot;