'use strict';
var config = require('./bot.conf.json');
var Bot = require('./bot/Bot.js');

var bot = new Bot(config);

bot.start()
  .then(() => {
    console.log('it\'s working!');
  }, (err) => {
    console.error('Outter error');
    console.error(err);
  });
