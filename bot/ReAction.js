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

  }
}

module.exports = ReAction;
