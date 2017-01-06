const Discord = require('discord.js');
const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');

const request = require('../util').request;

let urls = {
  forecast: 'http://www.metservice.com/publicData/localForecast',
  local: 'http://www.metservice.com/publicData/localObs_'
};
// A set of extra info for each weather type
let extras = {
  'fine': {
    icon: 'http://about.metservice.com/assets/img/icon-exp/sunny.png',
    color: '#FEE054',
    emoji: '☀'
  },
  'partly cloudy': {
    icon: 'http://about.metservice.com/assets/img/icon-exp/part-cloud.png',
    color: '#DFE1D3',
    emoji: '🌥'
  },
  'cloudy': {
    icon: 'http://about.metservice.com/assets/img/icon-exp/cloud.png',
    color: '#D4D6C8',
    emoji: '☁'
  },
  'few showers': {
    icon: 'http://about.metservice.com/assets/img/icon-exp/few-showers.png',
    color: '#29E2FF',
    emoji: '🌦'
  },
  'showers': {
    icon: 'http://about.metservice.com/assets/img/icon-exp/showers.png',
    color: '#35E5FF',
    emoji: '🌧'
  },
  'rain': {
    icon: 'http://about.metservice.com/assets/img/icon-exp/rain.png',
    color: '#4BA4B3',
    emoji: '⛆'
  },
  'drizzle': {
    icon: 'http://about.metservice.com/assets/img/icon-exp/drizzle.png',
    color: '#39E5FF',
    emoji: '🌦'
  },
  'fog': {
    icon: 'http://about.metservice.com/assets/img/icon-exp/fog.png',
    color: '#B5D6DD',
    emoji: '🌫'
  },
  'snow': {
    icon: 'http://about.metservice.com/assets/img/icon-exp/snow.png',
    color: '#FEFFFF',
    emoji: '❄'
  },
  'wind': {
    icon: 'http://about.metservice.com/assets/img/icon-exp/wind.png',
    color: '#C7CBB5',
    emoji: '🌬'
  },
  'thunder': {
    icon: 'http://about.metservice.com/assets/img/icon-exp/thunder.png',
    color: '#FFDF4E',
    emoji: '🌩'
  },
  'hail': {
    icon: 'http://about.metservice.com/assets/img/icon-exp/hail.png',
    color: '#DFE1D3',
    emoji: '🌨'
  }
};
let metserviceHelp = [
  'syntax: `~metservice <location>`',
  'Gets the weather forecast for a New Zealand town/city',
  'http://www.metservice.com/national/home'
];

class MetService extends ScriptAddon {
  constructor(bot) {
    super(bot, 'metservice');

    this.weatherCache = new Map();
  }

  init() {
    this.bot.addCommand('metservice', new Command(this.getWeatherData.bind(this), 'nz', metserviceHelp));
  }

  deinit() {
    // Do nothing
  }

  getWeatherData(input) {
    let message = input.message;
    let defConf = this.getConfig('default');
    let servConf;
    if (message.guild) {
      servConf = this.getConfig(message.guild);
    }

    let usr;

    return input.process()
      // Get the neame of the place
      .then((res) => {
        if (!res) {
          throw 'you must give a place to get the weather of';
        }

        // Load the list of aliases
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

        let match = name.match(/<@!?(\d+)>/);
        if (match) {
          name = match[1];
        }

        if (aliases.has(name)) {
          usr = name;
          name = aliases.get(name);
        }

        name = name.toLowerCase().replace(' ', '-');

        return name;
      })
      // Get the weather data
      .then((name) => {
        // Get stuff from the cache if it exists
        if (this.weatherCache.has(name)) {
          return this.weatherCache.get(name);
        }

        return Promise.all([
          `${urls.forecast}${name}`,
          `${urls.local}${name}`,
        ])
          // .then((urls) => {
          //   // Actually request
          //   return urls.map(url => request(url));
          // })
          // .then((responses) => {
          //   return responses.map(res => JSON.parse(res));
          // })
          // .then((res) => {
          //   // Add to cache, so request isn't made for another 2 hours
          //   this.weatherCache.set(name, res);
          //   setTimeout(() => {
          //     this.weatherCache.delete(name);
          //   }, 2*60*60*1000);
          //   return res;
          // });
          // While testing, use a local copy of a request, instead of getting fresh data all the time
          .then(() => {
            return require('../example-metservice-data.conf.json');
          });
      })
      // Output
      .then(([forecast, now]) => {
        let today = forecast.days.shift();
        let toSplice = 1;
        if (today.dow === 'Friday') {
          toSplice = 2;
        }

        forecast.days = forecast.days.splice(0, toSplice);
        let name = today.riseSet.location.replace(/ AWS/g, '');
        let todayEmoji;
        let ex;

        if (usr && defConf.privatize && defConf.privatize[usr]) {
          name = defConf.privatize[usr];
        }

        if (extras[today.forecastWord.toLowerCase()]) {
          ex = extras[today.forecastWord.toLowerCase()];

          if (ex.emoji) {
            todayEmoji = ex.emoji;
          }
        }

        let embed = new Discord.RichEmbed()
          .setAuthor(`Metservice - ${name}`, 'https://pbs.twimg.com/profile_images/585643069799804928/tSRlnatP.png')
          .setTitle(`${todayEmoji?`${todayEmoji} `:''}${today.dow}, ${today.date}`)
          .setDescription(today.forecast)
          .addField('Info', `Wind: ${now.threeHour.windSpeed}km/h (${now.threeHour.windDirection})\nRainfall: ${now.threeHour.rainfall}mm\nHumidity: ${now.threeHour.humidity}`, true)
          .addField('Temperatures', `Now: **${now.threeHour.temp}**°C (Feels like ${now.threeHour.windChill}°C)\nMax: *${today.max}*°C\nMin: *${today.min}*°C`, true);

        if (ex) {
          embed
            .setThumbnail(ex.icon)
            .setColor(ex.color);
        }

        let forecastTitle;
        switch (today.dow) {
          case 'Friday':
          case 'Saturday':
            forecastTitle = 'Weekend Forecast';
            break;
          default:
            forecastTitle = 'Tomorrow\'s Forecast';
        }

        let forecastDesc = [];
        forecast.days.forEach((day) => {
          let emoji = extras[day.forecastWord.toLowerCase()] ? extras[day.forecastWord.toLowerCase()].emoji : '';

          forecastDesc.push(`${emoji?`${emoji} `:''}**${day.dow}, ${day.date}**`);
          forecastDesc.push(`*${day.max}*°C / *${day.min}*°C`);
          forecastDesc.push(day.forecast);
        });

        embed.addField(forecastTitle, forecastDesc.join('\n'));



        this.bot.send(input.message.channel, embed);
        return '';
      })
      .catch(() => {
        throw 'unable to get the weather information';
      });
  }
}

module.exports = MetService;
