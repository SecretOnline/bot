/* eslint no-console: 0 */

const readline = require('readline');
const Connection = require('../bot/Connection.js');
const Channel = require('../bot/Channel.js');
const Message = require('../bot/Message.js');
const User = require('../bot/User.js');
const Server = require('../bot/Server.js');

class ConsoleConnection extends Connection {
  constructor(bot) {
    super(bot, 'Console', 'console');

    this.rl = null;

    if (!this.conf.servers) {
      this.conf.servers = {};
    }
    if (!this.conf.servers.console) {
      this.conf.servers.console = {
        addons: []
      };
    }

    // There's only one user and channel, so set here
    // There is the user, channel, and server caches, but it's quicker to do this
    this.user = new User(this, 'console');
    this.server = new Server(this, 'console', 'console');
    this.channel = new Channel(this, this.server, 'console');

  }

  open() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    this.rl.on('line', this.onLineReceived.bind(this));

    this._open();

    this.rl.prompt('>');
  }

  close() {
    this.rl.off('line', this.onLineReceived);
    this.rl.close();

    this._close();
  }

  mention(target) {
    if (target.name) {
      return target.name;
    } else {
      return target;
    }
  }

  send(target, message) {
    console.log(message);
    return Promise.resolve();
  }

  getPermissionLevel(user, channel) {
    return 2; // Console always has overlord status
  }

  onLineReceived(line) {
    if (line.match(/^x$|^exit$/)) {
      this.emit('quit', true);
      return;
    }

    let m = new Message(this.user, this.channel, line);
    this.emit('message', m);
    this.rl.prompt('>');
  }
}

module.exports = ConsoleConnection;