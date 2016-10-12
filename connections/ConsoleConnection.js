/* eslint no-console: 0 */

const readline = require('readline');
const Connection = require('../bot/Connection');
const Channel = require('../bot/Channel');
const User = require('../bot/User');
const Message = require('../bot/Message');

class ConsoleConnection extends Connection {
  constructor(bot) {
    super(bot, 'Console', 'c');

    this.rl = null;

    // There's only one user and channel, so set here
    this.channel = new Channel(this, 'console');
    this.user = new User(this, 'console');
  }

  open() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    this.rl.on('line', this.onLineReceived);

    this._open();
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
  }
}

module.exports = ConsoleConnection;
