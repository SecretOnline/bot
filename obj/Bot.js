/* jslint node: true, esversion: 6 */
'use strict';
var Command = require('./Command.js');
var Input = require('./Input.js');


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
    throw new Error('NYI');
  }

  registerCommand(trigger, comm) {
    this.commands.set(trigger, comm);

    if (this.conf.verbose) {
      console.log(`added command: ${trigger}`);
    }
  }

  addListeners() {
    this.d.Dispatcher.on('MESSAGE_CREATE', (event) => {
      var input = new Input(event.message, this);
      if (this.conf.verbose) {
        console.log(`${input.user.username}: ${input.raw}`);
      }

      // TODO: Proper command detection
      if (true) {
        input.process()
          .then((a) => {
            console.log(`<- ${a}`);
          });
      }
    });
  }

  getCommand(trigger, message) {
    if (typeof trigger === 'string') {
      // TODO: check server-specific command character
      // TODO: check user permissions
      if (trigger.charAt(0) === '~') {
        return this.commands.get(trigger.substr(1));
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
}

module.exports = Bot;
