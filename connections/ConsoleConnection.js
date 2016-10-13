/* eslint no-console: 0 */

const readline = require('readline');
const Connection = require('../bot/Connection.js');
const Channel = require('../bot/Channel.js');
const Message = require('../bot/Message.js');
const User = require('../bot/User.js');
const Server = require('../bot/Server.js');

class ConsoleConnection extends Connection {
  constructor(bot, config = {}) {
    super(bot, config, 'Console', 'c');

    this.rl = null;

    // There's only one user and channel, so set here
    this.server = new Server(this, 'console');
    this.channel = new Channel(this, 'console');
    this.server.addChannel(this.channel);
    this.user = new User(this, 'console');
  }

  open() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('starting connection');

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
  }

  getPermissionLevel(user) {
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
