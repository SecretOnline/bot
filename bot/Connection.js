const EventEmitter = require('events');

/**
 * Defines a connection to some message provider.
 * Should be extended for each connection method.
 */
class Connection extends EventEmitter {
  /**
   * Creates a new Connection
   * @param {Bot} bot The bot that this connection is linked to
   * @param {string} Name of connection
   * @param {string} Short name. Must be unique. Should be no more than 3 characters
   */
  constructor(bot, name, shortname) {
    super();

    this.n = name;
    this.i = shortname;
    this.o = false;
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
    retur this.o;
  }

  //endregion

  //region Functions

  /**
   * Generates a mention for the given target
   * Accepts a User, Channel, or null
   * If it receives null, should identify itself
   * Strings are accepted for fallback, but behaviour is undefined (up to each connection)
   * @param  {string|User|Channel=} target [description]
   * @return {[type]}        [description]
   */
  mention(target) {
    throw new Error('NYI');
  }

  //endregion

  //region Private Functions

  /**
   * Should be called when this connection is ready to be used
   */
  _open() {
    this.emit('open');
  }

  /**
   * Should be called when this connection isn't available for use (e.g. reconnecting)
   */
  _close() {
    this.emit('close');
  }

  //endregion
}

module.exports = Connection;
