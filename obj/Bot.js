/* jslint node: true, esversion: 6 */
'use strict';
var fs = require('fs');

var Command = require('./Command.js');
var Input = require('./Input.js');
var Discordie = require('discordie');


class Bot {
  constructor(discord, config) {
    this.commands = new Map();
    this.d = discord;
    this.conf = config;

    this.addListeners();
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
      fs.readdir('./addons/', (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        var proms = [];
        data.forEach((item) => {
          proms.push(this.loadAddon(item));
        });

        Promise.all(proms).then(() => {
          resolve(`reloaded. ${proms.length} addons, ${this.commands.size} commands`);
        }, reject);
      });
    });
  }

  loadAddon(name) {
    return new Promise((resolve, reject) => {
      name = `./addons/${name}`;
      var ext = name.split('.').pop();
      var mod, obj, keys;

      try {
        delete require.cache[require.resolve(name)];
      } catch (e) {
        console.error(`couldn't remove ${name} from require cache`);
      }

      if (ext === 'json') {
        try {
          obj = require.main.require(name);
        } catch (e) {
          console.error(`error while require-ing ${name}. continuing`);
          console.error(e);
          console.error(e.stack);
          resolve();
          return;
        }

        keys = Object.keys(obj);
        keys.forEach((key) => {
          var comm = new Command(obj[key], name);
          this.registerCommand(key, comm);
        });

        console.log(`loaded ${name}`);
        resolve();
      } else if (ext === 'js') {
        try {
          mod = require.main.require(name);
        } catch (e) {
          console.error(`error while require-ing ${name}. continuing`);
          console.error(e);
          console.error(e.stack);
          resolve();
          return;
        }

        try {
          mod.init(this);
          console.log(`loaded ${name}`);
        } catch (e) {
          console.error(`[ERROR] loading ${name}`);
          console.error(e.stack);
        }

        resolve();
      } else {
        console.log(`ignoring ${name}`);
        resolve();
      }
    });
  }

  registerCommand(trigger, comm) {
    this.commands.set(trigger, comm);
  }

  addListeners() {
    this.d.Dispatcher.on('MESSAGE_CREATE', (event) => {
      // Quick exit on self messages
      if (event.message.author.id === this.d.User.id) {
        return;
      }

      var input = new Input(event.message.content, event.message, this);
      if (this.conf.verbose) {
        console.log(`${input.user.username}: ${input.raw}`);
      }

      // TODO: Proper command detection
      var first = input.raw.split(' ')[0];
      if (this.getCommand(first, event.message)) {
        input.process()
          .then((a) => {
            console.log(`<- ${a}`);
          }, (a) => {
            console.err(`[ERROR] ${a}`);
          });
      }
    });
  }

  getCommand(trigger, message) {
    if (typeof trigger === 'string') {
      // TODO: check server-specific command character
      if (trigger.charAt(0) === '~') {
        let comm = this.commands.get(trigger.substr(1));
        // Check user permissions
        if (comm.permission) {
          let userPerm = Command.PermissionLevels.DEFAULT;

          // Check overlords list
          if (this.conf.overlords.indexOf(message.author.id) > -1) {
            userPerm = Command.PermissionLevels.OVERLORD;
          } else
          // Check server permissions
          if (message.guild && message.author.can(Discordie.Permissions.General.MANAGE_GUILD, message.guild)) {
            userPerm = Command.PermissionLevels.ADMIN;
          }

          if (userPerm >= comm.permission) {
            // TODO: check server allowed groups
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
  }
}

module.exports = Bot;
