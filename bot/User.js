const Channel = require('./Channel.js');

/**
 * Defines a user of a connection
 */
class User extends Channel {
  /**
   * Creates a new User
   * @param {Connection} connection The connection the user used to make this request
   * @param {string} name Name of the user
   * @param {string} id Unique identifier for the user for this connection
   */
  constructor(connection, name, id = name) {
    super(connection, name, id);
    this.conn = connection;
    this.n = name;
    this.i = id;
  }

  // Currently no outward differnce between Channel and User
}

module.exports = User;
