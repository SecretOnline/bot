const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');

class MarkovAddon extends ScriptAddon {
  constructor(bot) {
    super(bot, 'markov');

    this.channelData = new Map();
    this.numMessages = 100;
  }

  init() {
    this.bot.addCommand('markov', new Command(this.doMarkov.bind(this), 'markov'));
  }

  doMarkov(input) {
    return new Promise((resolve, reject) => {
      let id = input.message.channel.id;
      if (!this.channelData.has(id)) {
        this.channelData.set(id, []);
      }

      let oldMessages = this.channelData.get(id);
      let fetchOpt = {
        limit: this.numMessages
      };
      if (oldMessages.length) {
        fetchOpt.after = oldMessages[oldMessages.length - 1].id;
      }

      input.message.channel
        .fetchMessages(fetchOpt)
        .then((newMessages) => {
          let messages = oldMessages.slice(0, newMessages.length).concat(newMessages);

          this.channelData.set(id, messages);

          return messages;
        })
        .then((messages) => {
          let mkv = new markov(2);
          let promises = messages
            .filter(msg => msg.content) // Don't do messages with no content
            .map((message) => {
              return new Promise((resolve2, reject2) => {
                mkv.seed(message.cleanContent, resolve2);
              });
            });

          return Promise.all(promises)
            .then(() => {
              console.log('in markov');
              return mkv;
            });
        })
        .then((mkv) => {
          let res = mkv.respond(input.text);
          resolve(res);
        })
        .catch(reject);
    });
  }
}

module.exports = MarkovAddon;

class MarkovChain {
  constructor(order = 2) {
    
  }
  
  
}
