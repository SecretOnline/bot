/* eslint no-console: 0 */
'use strict';
var Bot = require('./bot/Bot.js');

var bot = new Bot('bot.conf.json');

bot.start()
  .then(() => {
    console.log('it\'s working!');
  }, (err) => {
    console.error('Outter error');
    console.error(err);
  });
