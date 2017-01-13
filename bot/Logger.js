const fs = require('fs');

/**
 * Handles reading/writing of logs
 * 
 * @class Logger
 */
class Logger {
  /**
   * Creates an instance of Logger.
   * 
   * @param {Bot} bot
   * @param {string} directory
   * 
   * @memberOf Logger
   */
  constructor(bot, directory) {
    this.bot = bot;
    this.dir = directory;
    this.logs = null;
    this._ready = new Promise((resolve, reject) => {
      // Store resolution function so we can call it in .start()
      this._readyFunc = resolve;
    });
  }
  
  //region Functions

  start() {
    return this.bot._listDirectory(this.dir)
      .then((files) => {
        let exp = /^(\w+)\.(\d+).log$/;
        let matches = files
          .map(f => f.match(exp)) // Match all files
          .filter(f => !!f); // Remove failed matches

        this.logs = matches.reduce((logMap, match) => {
          let id = match[1];
          let num = Number.parseInt(match[2]);

          // Set highest number for id
          if ((!logMap.has(id)) || (logMap.get(id) < num)) {
            logMap.set(id, num);
          }

          return logMap;
        }, new Map());
      })
      .then(() => {
        this._readyFunc();
      });
  }
  
  getLogs(location, limit = 80) {

  }

  log(location, message) {

  }

  error(location, error) {
    
  }
  
  //endregion
}

module.exports = Logger;
