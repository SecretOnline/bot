/**
 * A message
 * Should be used by Connections to send text to Bot
 */
class Message {
  /**
   * Creates a new Message
   * @param {User} user The user who sent this message
   * @param {string} channel The channel the user sent the message from
   * @param {string} text The text the user sent
   * @param {boolean} isBot Whether this message was caused by the bot or not
   */
  constructor(user, channel, text, isBot = false, shouldProcess = true) {
    this.u = user;
    this.c = channel;
    this.t = text;
    this.b = isBot;
    this.p = shouldProcess;
  }

  //region Properties

  get user() {
    return this.u;
  }

  get channel() {
    return this.c;
  }

  get text() {
    return this.t;
  }

  get connection() {
    return this.u.connection;
  }

  get isBot() {
    return this.b;
  }

  get shouldProcess() {
    return (!this.b) || this.p;
  }

  //endregion
}

module.exports = Message;
