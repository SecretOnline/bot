/**
 * An object to be used by commands
 */
class Input {
  /**
   * Creates a new input
   * @param  {Message} message Message that this input stems from
   * @param  {string=} text    Override text (uses message.text by default)
   */
  constructor(message, text = message.text) {
    this.m = message;
    this.t = text;
  }

  //region Properties

  get text() {
    return this.t;
  }

  get message() {
    return this.m;
  }

  get user() {
    return this.m.user;
  }

  //endregion

  //region Functions

  from(text) {
    return new Input(this.m, text);
  }

  //endregion

}

module.exports = Input;
