/* jslint node: true, esversion: 6 */
'use strict';
var Command = require('./obj/Command.js');
var Input = require('./obj/Input.js');


class Bot {
  constructor(discord, config) {
    this.commands = new Map();
    this.d = discord;
    this.conf = config;

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

    this.d.Dispatcher.once('GATEWAY_READY', e => {
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

  reconnect(e) {
    console.log(`[LOGIN] Disconnected: ${e.error.message}`);

    this.start();
  }

  forceReload() {
    throw new Error('NYI');
  }

  registerCommand(trigger, comm) {
    throw new Error('NYI');
  }

}

module.exports = Bot;
