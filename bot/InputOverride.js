let {firstNotNull} = require('../util');

/**
 * An override for an Input's data
 * 
 * @class InputOverride
 */
class InputOverride {
  /**
   * Creates an instance of InputOverride
   * 
   * @param {string} [text=null]
   * @param {(Discord.User|Discord.GuildMember)} [user=null]
   * @param {(Discord.DMChannel|Discord.TextChannel)} [channel=null]
   * 
   * @memberOf InputOverride
   */
  constructor(text = null, user = null, channel = null) {
    this._text = text;
    this._user = user;
    this._channel = channel;
  }

  /**
   * Text of this override
   * 
   * @readonly
   * 
   * @memberOf InputOverride
   */
  get text() {
    return this._text;
  }

  /**
   * User of this override
   * 
   * @readonly
   * 
   * @memberOf InputOverride
   */
  get user() {
    return this._user;
  }

  /**
   * Channel of this override
   * 
   * @readonly
   * 
   * @memberOf InputOverride
   */
  get channel() {
    return this._channel;
  }

  /**
   * Returns a new override based on this, but with features from the given override
   * 
   * @param {InputOverride} override A new Override
   * @returns
   * 
   * @memberOf InputOverride
   */
  merge(override) {
    return new InputOverride(
      firstNotNull(override.text, this.text),
      firstNotNull(override.user, this.user),
      firstNotNull(override.channel, this.channel)
    );
  }  
}

module.exports = InputOverride;
