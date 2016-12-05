/* eslint no-console: 0 */
'use strict';
let Bot = require('./bot/Bot.js');

// Use file provided in first command line argument, or default
let confFile = process.argv[2] || 'bot.conf.json';
let bot = new Bot(confFile);

bot.start()
  .then(() => {
    console.log('it\'s working!');
  }, (err) => {
    console.error('Outter error');
    console.error(err);
  });
