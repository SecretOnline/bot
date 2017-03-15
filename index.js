/* eslint no-console: 0 */
'use strict';
let Bot = require('./bot/Bot.js');

// Use file provided in first command line argument, or default
let confFile = process.argv[2] || 'bot.conf.json';
let bot = new Bot(confFile);

process.on('unhandledRejection', (e,p) => {
  console.error(e);
});

bot.start()
  .catch((err) => {
    console.error('fatal error while starting secret_bot');
    console.error(err);
  });
