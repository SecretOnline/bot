const JSONAddon = require('./JSONAddon.js');

/**
 * An addon for a particular server
 *
 * @class ServerAddon
 * @extends {JSONAddon}
 */
class ServerAddon extends JSONAddon {
  /**
   * Creates an instance of ServerAddon.
   * @param {Bot} bot Bot this addon belongs to
   * @param {Discord.Guild} guild  Server this addon belongs to
   *
   * @memberOf ServerAddon
   */
  constructor(bot, guild) {
    super(bot, {}, guild.id);

    this._guild = guild;
  }

  get description() {
    return `Addon for "${this._guild.name}"`;
  }

  get server() {
    return this._guild;
  }

  init() {
    // No initialisation needed
  }
}

module.exports = ServerAddon;
