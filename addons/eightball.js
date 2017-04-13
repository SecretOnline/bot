const ScriptAddon = require('../bot/ScriptAddon.js');
const Animation = require('../bot/Animation.js');

const {arrayRandom} = require('../util');

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

const embedColor = '#292F33';
const frames = [
  '🎱⚫⚫',
  '⚫🎱⚫',
  '⚫⚫🎱',
  '⚫🎱⚫',
  '🎱⚫⚫'
];
const STAGE_DELAY = 1000;

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
        res.add(new Animation([
          ...frames,
          `${frames[0]} ${arrayRandom(eightBall)}`
        ], STAGE_DELAY, embedColor));
        res.add(''); // Since processed text isn't relevant for this command

        return res;
      });
  }
}

module.exports = Eightball;
