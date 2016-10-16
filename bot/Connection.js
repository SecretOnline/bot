const EventEmitter = require('events');
const Server = require('./Server.js');

/**
 * Defines a connection to some message provider.
 * Should be extended for each connection method.
 */
class Connection extends EventEmitter {
  /**
   * Creates a new Connection
   * @param {Bot} bot The bot that this connection is linked to
   * @param {Object} config Configuration for this connection
   * @param {string} Name of connection
   * @param {string} Short name. Must be unique. Should be no more than 3 characters
   */
  constructor(bot, name = 'NONAME', id = name) {
    super();

    this.bot = bot;
    this.n = name;
    this.i = id;

    this.o = false;
    this.serverCache = new Map();
    this.channelCache = new Map();
    this.userCache = new Map();

    this.conf = bot.getConfig(this);
  }

  //region Properties

  /**
   * Full name of this connection
   * @return {string} Name of connection
   */
  get name() {
    return this.n;
  }

  /**
   * Returns the short name (id) of this connection
   * @return {string} Short name of connection
   */
  get id() {
    return this.i;
  }

  /**
   * Returns whether this connection is open
   * @return {boolean} Open state
   */

  get openState() {
    return this.o;
  }

  //endregion

  //region Functions

  open() {
    throw new Error('Open function not overridden');
  }

  close() {
    throw new Error('Close function not overridden');
  }

  /**
   * Generates a mention for the given target
   * Accepts a User, Channel, or null
   * If it receives null, should identify itself
   * Strings are accepted for fallback, but behaviour is undefined (up to each connection)
   * @param  {string|User|Channel} target Targeet to generate mention for
   * @return {string} Mention for the target
   */
  mention(target) {
    throw new Error('Mention function not overridden');
  }

  /**
   * Sends a string to the given target
   * Accepts a User, Channel, or null
   * If it receives null, should identify itself
   * Strings are accepted for fallback, but behaviour is undefined (up to each connection)
   * @param  {string|User|Channel} target Target of the message
   * @param  {string|Message|Input} target [description]
   * @return {Promise<,Error>} Resolves on successful sending
   */
  send(target, message) {
    throw new Error('Send function not overridden');
  }

  getPermissionLevel(user, channel) {
    throw new Error('Permission Level function not overridden');
  }

  getConfig(obj) {
    if (obj instanceof Server) {
      return this.conf.servers[obj.id] || {};
    }
  }

  setConfig(obj, val) {
    let changed = false;

    if (obj instanceof Server) {
      this.conf.servers[obj.id] = val;
      changed = true;
    }

    if (changed) {
      this.bot.setConfig(this, this.conf);
    }
  }

  //endregion

  //region Private Functions

  /**
   * Should be called when this connection is ready to be used
   */
  _open() {
    this.o = true;
    this.emit('open');
  }

  /**
   * Should be called when this connection isn't available for use (e.g. reconnecting)
   */
  _close() {
    this.o = false;
    this.emit('close');
  }

  //endregion
}

module.exports = Connection;
