const ScriptAddon = require('../bot/ScriptAddon.js');
const {arrayRandom} = require('../util');

const nwHelp = [
  'syntax: `~<nw/numberwang> <a number>`',
  'use `~numberwang start` to begin a round',
  'plays a game of Numberwang (https://www.youtube.com/watch?v=qjOZtWZ56lc)',
  'what is Numberwang?',
  'Numberwang is the maths quiz that simply everyone is talking about'
];

// Some bits of text to throw in
const intros = [
  'welcome back to Numberwang, the maths quiz that simply everyone is talking about',
  'it\'s time for Numberwang, the maths quiz show that everyone\'s talking about',
  'hello! you\'re watching Numberwang, the maths quiz show that simply everyone'
];
const wangernumbs = [
  'it\'s time for Wangernumb! let\'s rotate the board!',
  'that\'s today\'s Wangernumb. rotate the board!',
  'that\'s Wangernumb. time to rotate the board!'
];
const outros = [
  'that\'s all we have time for today. good Numberwang!',
  'remember to stay Numberwang. good Numberwang!',
  'we\'re out of numbers today, we\'ll be back again with half as many. good Numberwang!'
];
const thatsnumberwang = [
  'that\'s Numberwang!',
  'that\'s Numberwang!',
  'that\'s Numberwang!',
  'yep, that\'s Numberwang!',
  'oohhh, that\'s Numberwang!',
  'yes! Numberwang!',
  'Numberwang!'
];
const thatswangernumb = [
  'that\'s Wangernumb!'
];
const introductions = [
  [
    'who likes ducks',
    'who likes chickens'
  ],
  [
    'who is from the internet',
    'who is also from the internet'
  ],
  [
    'who doesn\'t know today\'s answers',
    'who does'
  ],
  [
    'eating a taco',
    'eating a burrito'
  ],
  [
    'promoting equality',
    'promiting exactness'
  ]
];

class NumberWang extends ScriptAddon {
  constructor(bot) {
    super(bot, 'numberwang');

    this.servers = new Map();
    this.difficulty = 5;
  }

  init() {
    this.addCommand('nw', this.doNumberwang, nwHelp);
    this.addCommand('numberwang', this.doNumberwang, nwHelp);
  }

  doNumberwang(input) {
    let sid = input.message.guild.id;
    let arg = input.text.split(' ')[0];
    let num;
    try {
      num = Number.parseFloat(arg);
    } catch (e) {
      num = null;
    }
    if (!(num === null || isNaN(num))) {
      if (this.servers.has(sid)) {
        return this.giveResponse(input);
      } else {
        return 'Numberwang\'s taking a quick break. we\'ll be back before you can think \'Numberwang\'!';
      }
    } else {
      if (arg.toLowerCase() === 'start') {
        return this.startNw(input);
      }
    }
  }

  startNw(input) {
    let sid = input.message.guild.id;
    let uid = input.user.id;
    if (this.servers.has(sid)) {
      let server = this.servers.get(sid);
      if (server.players.length === 1) {
        if (server.players[0].id === input.user.id) {
          return;
        }

        server.players.push(input.user);
        return [
          arrayRandom(intros),
          'today\'s initial contestants are:',
          ...this.introduce(server.players),
          'others may join as we continue the show',
          'we\'ll start with whoever is the fastest typer'
        ].join('\n');
      } else {
        return `just start guessing, ${input.user.mention}`;
      }
    } else {
      let conf = {
        players: [input.user],
        lastId: 0,
        diff: this.difficulty,
        rounds: Math.floor(Math.random() * 4) + 2,
        wn: false
      };
      this.servers.set(sid, conf);
      return 'we\'ll need another contestant before we can get started with Numberwang';
    }
  }

  introduce(players) {
    var lines = arrayRandom(introductions);
    return [
      `${players[0].mention} ${lines[0]}`,
      `${players[1].mention} ${lines[1]}`
    ];
  }

  giveResponse(input) {
    var sid = input.message.guild.id;
    var conf = this.servers.get(sid);

    var user = conf.players.find((u) => {
      return u.id === input.user.id;
    });

    if (!user) {
      user = input.user;
      conf.players.push(user);
    }

    if (conf.lastId === user.id) {
      return `wait your turn, ${user.toString()}`;
    }

    conf.lastId = user.id;

    if (Math.floor(Math.random() * conf.diff) === 0) {

      conf.rounds--;
      conf.diff = Math.max(2, conf.diff - 0.5);
      if (conf.rounds <= 0) {
        if (conf.wn) {
          this.servers.delete(sid);
          return [
            `${user.toString()} ${arrayRandom(thatswangernumb)}`,
            `today's winner was ${arrayRandom(conf.players).toString()}. congratulations!`,
            arrayRandom(outros)
          ].join('\n');
        } else {
          conf.wn = true;
          return `${user.toString()} ${arrayRandom(wangernumbs)}`;
        }
      } else {
        conf.diff = this.difficulty;
        return `${user.toString()} ${arrayRandom(thatsnumberwang)}`;
      }
    }
  }
}

module.exports = NumberWang;
