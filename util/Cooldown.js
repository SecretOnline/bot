/**
 * A cooldown that can be "bumped" in smaller increments
 * Timer value descreases by 1 every millisecond
 * Does not create any setInterval loops
 * 
 * @class Cooldown
 */
class Cooldown {
  /**
   * Creates an instance of Cooldown.
   * @param {number} max Maximum value for the cooldown (ms)
   * @param {number} [amount=max] Amount to increase value by each bump
   * 
   * @memberOf Cooldown
   */
  constructor(max, amount = max) {
    this._max = max;
    this._bump = amount;

    this._value = 0;
    this._timestamp = Date.now();
  }
  
  /**
   * Bumps the value of the countdown
   * If no parameter given, uses the default bump defined in the constructor
   * 
   * If this function returns true, then everything's fine
   * If it returns false, then either:
   *   The value was already over the max
   *   If preCheck is set, the future value would be over the max
   *   The value once updated is over the max
   * 
   * @param {number} [amount=this._bump] Amount to increase the value by
   * @param {boolean} [preCheck=true] Allows the bypassing of the initial check, so value can exceed the max (once, unitl it goes back under)
   * @returns {boolean} Whether the countdown is over the max
   * 
   * @memberOf Cooldown
   */
  bump(amount = this._bump, preCheck = true) {
    if (amount === true) {
      amount = this._bump;
      preCheck = true;
    }

    let current = this.update();

    // If the value is already above, don't do anything
    if (current > this._max) {
      return false;
    }

    // Make sure the bump can actually be done
    if (preCheck) {
      if (current + amount > this._max) {
        return false;
      }
    }

    this._value = current + amount;
    return this._max > this._value;
  }

  /**
   * Whether the cooldown is below the max
   * 
   * @returns {boolean} Whether the cooldown is below the max
   * 
   * @memberOf Cooldown
   */
  status() {
    return this._max > this.update();
  }

  /**
   * Updates the internal value
   * Since this class is reactive, it must update the value before testing the current value
   * 
   * @returns {number} The current cooldown value
   * 
   * @memberOf Cooldown
   */
  update() {
    // If the value's at its lowest already, no need to try calculate it again
    if (this._value === 0) {
      return this._value;
    }

    let now = Date.now();
    let diff = this._timestamp - now;

    this._timestamp = now;
    this._value = Math.max(this._value - diff, 0);

    return this._value;
  }
}

module.exports = Cooldown;
