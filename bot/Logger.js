const fs = require('fs');
const Discord = require('discord.js');
const Addon = require('./Addon.js');

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
    this.maxLogLength = 50;
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
        // Load current file into memory
        return this._getLogFile(this.currentId);
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

  log(message, location, isError = false) {
    return Promise.resolve()
      .then(() => {
        let line = {
          timestamp: Date.now()
        };

        if (location instanceof Discord.Channel) {
          line.type = 'message';
          line.id = message.id;
          line.author = message.author.id;
          line.username = message.author.username;
          line.channel = location.id;
          line.message = message.content;

          if (location.guild) {
            line.guild = location.guild.id;
          }

          if (message.embeds) {
            line.embed = true;
          }
        } else {
          let source = location;
          if (location instanceof Addon) {
            source = location.namespace;
          }

          line.source = source;
          line.type = 'log';
          line.message = message;
        }

        if (isError) {
          if (message instanceof Error) {
            line.stack = message.stack;
            line.message = message.message;
          } else {
            line.message = message;
          }
        }

        return line;
      })
      .then((line) => {
        // Log to console
        if (line.type === 'message') {
          if (line.author !== this.bot.discord.user.id) {
            console.log(`> ${line.username}: ${line.message}`); // eslint-disable-line no-console
          }
        } else {
          let out = `[${line.source}] ${line.message}`;
          if (line.type === 'error') {
            out = `[ERROR]${out}`;
            console.error(out); // eslint-disable-line no-console
          } else {
            console.log(out); // eslint-disable-line no-console
          }
        }
        
        return line;
      })
      .then((line) => {
        // Append to file
        return new Promise((resolve, reject) => {
          // Do filesystem stuff
          let lineStr = `${JSON.stringify(line)}\n`;
          fs.appendFile(`./${this.dir}/${this.currentId}.log`, lineStr, (err) => {
            if (err) {
              reject(err);
              return;
            }
            resolve();
          });

          // Add to cache
          if (!this.cache.has(this.currentId)) {
            this.cache.set(this.currentId, []);
          }
          let set = this.cache.get(this.currentId);
          set.push(line);
          if (set.length >= this.maxLogLength) {
            this.currentId += 1;
          }
        });
      });
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
    return this._getLogFile(id)
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
        return []; // Any errors get caught and return an empty array
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
          .then((lines) => {
            this.cache.set(id, lines);

            // Add a timeout so memory frees over time
            setTimeout(() => {
              this.cache.delete(id);
            }, 12*60*60*1000);

            return lines;
          })
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
      .filter(l => !l.match(/^#|^\/\/|(?:^.{0}$)/)) // Remove comments and newline
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
  
  static filterByError(addon) {
    return (line) => {
      if (line.type !== 'error') {
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
