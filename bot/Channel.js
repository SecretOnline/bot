/**
 * A channel in a connection
 */
class Channel {
  constructor(connection, name, id = name) {
    this.conn = connection;
    this.n = name;
    this.i = id;
  }

  //region Properties

  get connection() {
    return this.conn;
  }

  get name() {
    return this.n;
  }

  get id() {
    return this.i;
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

module.exports = Channel;
