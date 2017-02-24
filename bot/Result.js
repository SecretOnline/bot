/**
 * A result from a command
 * 
 * @class Result
 */
class Result {
  constructor() {
    
  }
  
  /**
   * Throws an exception to notify of commands that haven't been updated
   * to use Results yet 
   * 
   * @memberOf Result
   */
  toString() {
    throw 'command has not been updated to handle Results';
  }
}

module.exports = Result;
