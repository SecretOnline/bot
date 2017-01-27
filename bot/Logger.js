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
    this.cache = new Map();
    this.currentId = null;
    this._ready = new Promise((resolve, reject) => {
      // Store resolution function so we can call it in .start()
      this._readyFunc = resolve;
    });
  }
  
  //region Functions

  /**
   * Starts the logger
   * 
   * @returns {Promise} Resolves when logger is ready to accept messages
   * 
   * @memberOf Logger
   */
  start() {
    return this.bot._listDirectory(this.dir)
      .then((files) => {
        files = files.filter(f => f.match(/^\d+\.log$/));
        if (files.length === 0) {
          this.currentId = 0;
          return;
        }
        this.currentId = files
          .filter(f => f.match(/^(\d+)\.log$/)[1])
          .map(n => Number.parseInt(n))
          .reduce((max, curr) => Math.max(max, curr));
      })
      .then(() => {
        this._readyFunc();
      });
  }
  
  /**
   * Gets the latest logs that match a particular function
   * 
   * @param {function} filter
   * @param {number} [limit=80]
   * 
   * @memberOf Logger
   */
  getLogs(filter, limit = 80) {
    return this._filterLogs(filter, limit, this.currentId);
  }

  log(location, message) {
    
  }

  error(location, error) {

  }
  
  //endregion

  //region Private functions

  /**
   * Tries to get <limit> lines of log 
   * Will recur to get morefrom previous log files
   * 
   * @param {function} filter Filtering function to apply
   * @param {number} limit Number of lines to get
   * @param {number} id File id to gets logs from
   * @returns {Promise} Resolves with lines of log
   * 
   * @memberOf Logger
   */
  _filterLogs(filter, limit, id) {
    return new Promise((resolve, reject) => {
      this._getLogFile(id)
        .then(this._parseLog)
        .then((lines) => {
          return lines.filter(filter);
        })
        .then((lines) => {
          if (lines.length === limit) {
            return lines;
          } else if (lines.length < limit) {
            let remaining = limit - lines.length;
            return this._filterLogs(filter, remaining, id - 1)
              .then((result) => {
                return lines.concat(result);
              });
          } else {
            lines.splice(limit);
            return lines;
          }
        })
        .catch((err) => {
          resolve([]); // Any errors get caught and return an empty array
        });
    });
  }

  /**
   * Wrapper that either gets log from cache or from disk
   * 
   * @param {number} id
   * @returns {Promise<Array>} Resolves with log data
   * 
   * @memberOf Logger
   */
  _getLogFile(id) {
    return new Promise((resolve, reject) => {
      if (this.cache.has(id)) {
        let items = this.cache.get(id);
        if (items.length === 0) {
          reject('no items were found for this id');
        }
        resolve(items);
      } else {
        this._readFile(id)
          .then(this._parseLog)
          .then(resolve, reject);
      }
    });
  } 
  
  /**
   * Reads a log file
   * 
   * @param {number} id
   * @returns {Promise<string>} Resolves with file contents
   * 
   * @memberOf Logger
   */
  _readFile(id) {
    return new Promise((resolve, reject) => {
      fs.readFile(`./${this.dir}/${id}.log`, 'utf8', (err, data) => {
        if (err) {
          reject();
          return;
        }
        resolve(data);
      });
    });
  }

  /**
   * Parses the log data into an array
   * 
   * @param {string} data
   * @returns {Promise<Array>} Resolves with parsed data
   * 
   * @memberOf Logger
   */
  _parseLog(data) {
    return data.split(/\r?\n/)
      .filter(l => !l.match(/^#|\/\//)) // Remove comments
      .map(l => JSON.parse(l));
  }
  
  //endregion

  //region Static Functions
  
  static filterByGuild(guild) {
    return (line) => {
      if (line.type !== 'message') {
        return false;
      }
      if (line.guild !== guild.id) {
        return false;
      }

      return true;
    };
  }
  
  static filterByChannel(channel) {
    return (line) => {
      if (line.type !== 'message') {
        return false;
      }
      if (line.channel !== channel.id) {
        return false;
      }

      return true;
    };
  }
  
  static filterByAddon(addon) {
    return (line) => {
      if (line.type !== 'log') {
        return false;
      }
      if (line.source !== addon.namespace) {
        return false;
      }

      return true;
    };
  }
  
  //endregion
}

module.exports = Logger;
