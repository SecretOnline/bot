/**
 * A message
 * Should be used by Connections to send text to Bot
 */
class Message {
  /**
   * Creates a new Message
   * @param {User} user The user who sent this message
   * @param {string} text The text the user sent
   */
  constructor(user, text) {
    this.u = user;
    this.t = text;
  }

  //region Properties

  get user() {
    return this.u;
  }

  get text() {
    return this.t;
  }

  get connection() {
    return this.u.connection;
  }

  //endregion
}

module.exports = Message;
