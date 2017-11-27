import Message from './common/Message';
import Bot from './bot/Bot';

var conf = require('../bot.conf.json');

console.log('hello world');

let bot = new Bot();

bot
  .start(conf)
  .then(() => {
    console.log('bot is running');
  });
