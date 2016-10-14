/* eslint no-console: 0 */

const fs = require('fs');
const Connection = require('./Connection.js');
const Channel = require('./Channel.js');
const Input = require('./Input.js');
const Message = require('./Message.js');
const User = require('./User.js');

class Bot {
  constructor(config) {
    this.c = config;

    this.commands = new Map();
    this.connections = [];
    this.addons = [];
  }

  //region Functions

  start() {
    let connectionProm = this.reloadConnections();
    let addonProm = connectionProm
      .then(this.reloadAddons);

    return Promise.all([connectionProm, addonProm]);
  }

  stop() {

  }

  reloadAddons() {
    return Promise.resolve();
    // return this._deinitAddons(this.addons)
    //   .catch((err) => {
    //     console.error('Error while trying to deinit addons');
    //     console.error(err);
    //   })
    //   .then(() => {
    //     return this._listDirectory(this.c.paths.addons)
    //       .then(this._createAddons)
    //       .then(this._initAddons);
    //   });
  }

  reloadConnections() {
    console.log('[BOT] loading connections');
    return this._listDirectory(this.c.paths.connections)
      .then((a) => {
        console.log('have paths');
        return a;
      })
      .then(this._createConnections.bind(this))
      .then((a) => {
        console.log('have connections');
        return a;
      })
      .then(this._openConnections.bind(this));
  }

  addCommand(trigger, command) {
    if (this.commands.has(trigger)) {
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

  getCommand() {

  }

  listCommands() {

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
    return new Promise((resolve, reject) => {

    });
  }

  _initAddons(addons) {
    let promises = addons.map(addons => addons.init());
    return Promise.all(promises);
  }

  _deinitAddons(addons) {
    let promises = addons.map(addons => addons.deinit());
    return Promise.all(promises);
  }

  _createConnections(files) {
    console.log(this);
    let bot = this;
    let promises = files.map(file => new Promise((resolve, reject) => {
      console.log(`making connection ${file}`);
      let mod;
      try {
        mod = require(`../${bot.c.paths.connections}${file}`);
      } catch (e) {
        console.error('Failed to make connection');
        console.error(e);
        reject(e);
        return;
      }
      console.log('before new');
      let conn = new mod(this, {});
      this.connections.push(conn);
      console.log(conn instanceof Connection);
      resolve(conn);
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
    console.log(message.text);
  }

  //region

}

module.exports = Bot;
