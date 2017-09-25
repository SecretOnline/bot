import Message from './common/Message';
import DiscordJs from './connections/Discord';

var conf = require('../bot.conf.json');

console.log('hello world');

let a = new DiscordJs();

a.on('message', (msg: Message) => {
  console.log(`${msg.user.name}: ${msg.text}`);
});

a.start(conf.connections.djs);
