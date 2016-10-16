/**
 * A channel in a connection
 */
class Channel {
  constructor(connection, server, name, id = name) {
    this.conn = connection;
    this.s = server;
    this.n = name;
    this.i = id;

    this.s.addChannel(this);
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

  get server() {
    return this.s;
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
