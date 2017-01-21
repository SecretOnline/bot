const fs = require('fs');
const Discord = require('discord.js');

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
          .filter(f => f.match(/^(\d+)\.log$/)[0])
          .map(n => Number.parseInt(n))
          .reduce((max, curr) => Math.max(max, curr));
      })
      .then(() => {
        this._readyFunc();
      });
  }
  
  /**
   * Gets the latest logs for a particular location
   * 
   * @param {(string|Discord.Guild|Discord.Channel)} location
   * @param {number} [limit=80]
   * 
   * @memberOf Logger
   */
  getLogs(location, limit = 80) {
    return new Promise((resolve, reject) => {
      this._getLogFile(this.currentId)
        .catch(e => []) // Just return an empty set of getting logs failed
        .then((lines) => {
          if (typeof location === 'string') {
            return this._filterString(lines, location);
          } else if (location instanceof Discord.Guild) {
            return this._filterGuild(lines, location);
          } else if (location instanceof Discord.Channel) {
            return this._filterChannel(lines, location);
          } else {
            return [];
          }
        })
        .then(reject, resolve);
    });
  }

  log(location, message) {

  }

  error(location, error) {

  }
  
  //endregion

  //region Private functions

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

  /**
   * Filters log lines by guild
   * 
   * @param {Array} lines
   * @param {Discord.Guild} guild
   * @returns {Array}
   * 
   * @memberOf Logger
   */
  _filterGuild(lines, guild) {
    return lines.filter((line) => {
      if (line.type !== 'message') {
        return false;
      }
      if (line.guild !== guild.id) {
        return false;
      }

      return true;
    });
  }

  /**
   * Filters log lines by channel
   * 
   * @param {Array} lines
   * @param {Discord.Channel} channel
   * @returns {Array}
   * 
   * @memberOf Logger
   */
  _filterChannel(lines, channel) {
    return lines.filter((line) => {
      if (line.type !== 'message') {
        return false;
      }
      if (line.channel !== channel.id) {
        return false;
      }

      return true;
    });
  }

  /**
   * Filters log lines by source
   * 
   * @param {Array} lines
   * @param {string} str
   * @returns {Array}
   * 
   * @memberOf Logger
   */
  _filterString(lines, str) {
    return lines.filter((line) => {
      if (line.type !== 'log') {
        return false;
      }
      if (line.source !== str) {
        return false;
      }

      return true;
    });
  }
  
  //endregion
}

module.exports = Logger;
