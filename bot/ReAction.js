const InputOverride = require('./InputOverride');

/**
 * An action to be taken when reacted to
 * 
 * @class ReAction
 */
class ReAction {
  /**
   * Creates an instance of ReAction.
   * 
   * @param {(string|function)} action Action to be taken then reacted to
   * 
   * @memberOf ReAction
   */
  constructor(input, action) {
    this._input = input;
    this._action = action;
  }
  
  act(user, channel) {
    let str;
    let over = new InputOverride('', user, channel);

    if (typeof this._action === 'string') {
      str = this._action;
    } else if (typeof this._action === 'function') {
      let fRes = this._action(this._input.from(over));
      if (typeof fRes === 'string') {
        str = fRes;
      } else if (fRes instanceof Promise) {
        return fRes;
      }
    }

    over = over.merge(new InputOverride(str));

    return this._input
      .from(over)
      .process();
  }
}

module.exports = ReAction;
