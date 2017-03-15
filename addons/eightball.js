const ScriptAddon = require('../bot/ScriptAddon.js');

const {arrayRandom, promiseChain, embedify} = require('../util');

const eightBallHelp = [
  'syntax: `~eightball <yes/no question>`',
  ''
];

const eightBall = [
  'It is certain',
  'It is decidedly so',
  'Without a doubt',
  'Yes definitely',
  'You may rely on it',
  'As I see it, yes',
  'Most likely',
  'Outlook good',
  'Yes',
  'Signs point to yes',
  'Reply hazy, try again',
  'Ask again later',
  'Better not tell you now',
  'Cannot predict now',
  'Concentrate and ask again',
  'Don\'t count on it',
  'My reply is no',
  'My sources say no',
  'Outlook not so good',
  'Very doubtful'
];

const initial = '🎱⚫⚫';
const stageEmbeds = [
  '⚫🎱⚫',
  '⚫⚫🎱',
  '⚫🎱⚫',
].map(embedify);

class Eightball extends ScriptAddon {
  constructor(bot) {
    super(bot, 'eightball');
  }

  get description() {
    return 'Adds a magic eight ball for your entertainment';
  }

  init() {
    this.addCommand('eightball', this.getEightball, eightBallHelp);
  }

  getEightball(input) {
    return input.process()
      .then((res) => {
        let messageProm = input.channel.send({embed: embedify(initial)});

        messageProm
          .then((message) => {
            let answer = arrayRandom(eightBall);

            let stageFunctions = stageEmbeds.map((stage) => {
              return () => message.edit({embed: stage});
            });
            let startFunction = () => messageProm;
            let finalFunction = () => message.edit({embed: embedify(`${initial} ${answer}`)});

            return promiseChain([
              startFunction, // Really only here for tidyness
              ...stageFunctions,
              finalFunction
            ]);
          })
          .then(() => {
            return '';
          });
      });
  }
}

module.exports = Eightball;
