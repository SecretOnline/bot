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

  //region Properties

  get name() {
    return this.n;
  }

  get id() {
    return this.i;
  }

  get connection() {
    return this.conn;
  }

  //endregion

  //region Functions

  mention() {
    this.conn.mention(this);
  }

  send(str) {
    this.conn.send(this, str);
  }

  //endregion
}

module.exports = User;
