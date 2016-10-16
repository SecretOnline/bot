const Channel = require('./Channel.js');

/**
 * A server. Ever connection should have at least one
 */
class Server {
  constructor(connection, name, id = name, botId = undefined) {
    this.conn = connection;
    this.n = name;
    this.i = id;
    this.ii = botId;

    this.channels = [];
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

  get botId() {
    return this.ii;
  }

  set botId(val) {
    this.ii = val;
  }

  //endregion

  //region Functions

  addChannel(channel) {
    if (channel instanceof Channel) {
      this.channels.push(channel);
    } else {
      throw new Error('Tried to add a non-channel object');
    }
  }

  //endregion
}

module.exports = Server;
