const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');

const request = require('../util').request;

class MetService extends ScriptAddon {
  constructor(bot) {
    super(bot, 'metservice');
  }

  init() {
    this.bot.addCommand('metservice', new Command(this.getWeatherData.bind(this), 'nz'));
  }

  deinit() {
    // Do nothing
  }

  getWeatherData(input) {
    input.process()
      // Get the neame of the place
      .then((res) => {
        if (!res) {
          throw 'you must give a place to get the weather of';
        }

        let message = input.message;
        let defConf = this.getConfig('default');
        let servConf;
        if (message.guild) {
          servConf = this.getConfig(message.guild);
        }

        let aliases = new Map();
        if (defConf.aliases) {
          Object.keys(defConf.aliases)
            .forEach((key) => {
              aliases.set(key, defConf.aliases[key]);
            });
        }
        if (servConf && servConf.aliases) {
          Object.keys(defConf.aliases)
            .forEach((key) => {
              aliases.set(key, defConf.aliases[key]);
            });
        }

        // Get the proper place name that the MetService API actually understands
        let name = res;

        if (message.mentions.users && message.mentions.users.length) {
          name = message.mentions.users[0].id;
        }

        if (aliases.has(name)) {
          name = aliases.get(name);
        }

        name = name.toLowerCase().replace(' ', '-');

        return name;
      })
      // Get the weather data
      .then((name) => {
        // TODO: Make request
      })
      .then((data) => {
        // TODO: Output the data
      });
  }
}

module.exports = MetService;
