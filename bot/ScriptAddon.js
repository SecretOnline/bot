const Addon = require('./Addon.js');

/**
 * 
 * 
 * @class ScriptAddon
 * @extends {Addon}
 */
class ScriptAddon extends Addon {
  /**
   * Creates an instance of ScriptAddon.
   * 
   * @param {any} bot
   * @param {string} [filename='NONAME']
   * 
   * @memberOf ScriptAddon
   */
  constructor(bot, filename = 'NONAME') {
    super(bot, filename);
  }

  /**
   * Starts up the Addon
   * 
   * @returns {(Promise<any>|any)} Resolves (or returns) when Addon is loaded
   * 
   * @memberOf ScriptAddon
   */
  init() {
    return Promise.reject('ScriptAddon didn\'t overwrite init. Does it add any commands?');
  }

  /**
   * Shuts down the Addon
   * 
   * @returns {(Promise<any>|any)} Resolves (or returns) when the Addon is no longer loaded 
   * 
   * @memberOf ScriptAddon
   */
  deinit() {
    return;
  }

  /**
   * Gets the configuration for this Addon
   * 
   * @param {string} [server='default'] Server to get the configuration of
   * @returns {any} Stored configuration for this Addon/Server
   * 
   * @memberOf ScriptAddon
   */
  getConfig(server = 'default') {
    return this.bot.getConfig(this, server);
  }

  /**
   * Sets the configuration for this addon
   * 
   * @param {any} conf Configuration object to set
   * @param {string} [server='default'] Server to set the configuration of
   * @returns {Promise} Resolves when configuration is written to disk
   * 
   * @memberOf ScriptAddon
   */
  setConfig(conf, server = 'default') {
    return this.bot.setConfig(this, conf, server);
  }

  /**
   * Gets the configuration for a user for this addon
   * 
   * @param {Discord.User} user User to get configuration of
   * @returns {any} Stored configuration for this user
   * 
   * @memberOf ScriptAddon
   */
  getUser(user) {
    return this.bot.getConfig(user, this);
  }

  /**
   * Sets a user's configuration for this addon
   * 
   * @param {any} conf Configuration to write
   * @param {Discord.User} user User to set the configuration of
   * @returns {Promise} Resolves when configuration is written
   * 
   * @memberOf ScriptAddon
   */
  setUser(conf, user) {
    return this.bot.setConfig(user, conf, this);
  }

  /**
   * Gets the static data for this addon
   * 
   * @returns {Promise}
   * 
   * @memberOf ScriptAddon
   */
  getData() {
    return this.bot.getData(this);
  }
}

module.exports = ScriptAddon;
