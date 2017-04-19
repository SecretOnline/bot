/* eslint no-console: 0 */
let Discord = require('discord.js');
let Bot = require('./bot/Bot.js');

// Use file provided in first command line argument, or default
let confFile = process.argv[2] || 'bot.conf.json';
let conf = require(`./${confFile}`);

let client = new Discord.Client();
client.login(conf.token);
client.on('ready', () => {
  console.log('thing is ready');
});

let bot = new Bot(client, conf.bot);

process.on('unhandledRejection', (e,p) => {
  console.error(e);
});

bot.start()
  .catch((err) => {
    console.error('fatal error while starting secret_bot');
    console.error(err);
  });
