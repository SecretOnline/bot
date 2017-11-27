import Addon, { IAddonConfig } from '../common/Addon';
import Input from '../common/Input';
import Command from '../common/Command';
import User from '../common/User';
import TextSendable from '../sendables/TextSendable';
import AddonError from '../errors/AddonError';

import { arrayRandom } from '../util';

interface NwGame {
  players: User[];
  lastId: string;
  diff: number;
  rounds: number;
  wn: boolean;
}

const nwHelp = [
  'syntax: `~<nw/numberwang> <a number>`',
  'use `~numberwang start` to begin a round',
  'plays a game of Numberwang (https://www.youtube.com/watch?v=qjOZtWZ56lc)',
  'what is Numberwang?',
  'Numberwang is the maths quiz that simply everyone is talking about',
].join('\n');

// Some bits of text to throw in
const intros = [
  'welcome back to Numberwang, the maths quiz that simply everyone is talking about',
  'it\'s time for Numberwang, the maths quiz show that everyone\'s talking about',
  'hello! you\'re watching Numberwang, the maths quiz show that simply everyone',
  'it\'s time for Numberwang, the maths quiz show that everyone. is talking about? YES!',
  'instead of starting with round 1, let\'s begin round 1',
];
const wangernumbs = [
  'it\'s time for Wangernumb! let\'s rotate the board!',
  'that\'s today\'s Wangernumb. rotate the board!',
  'that\'s Wangernumb. time to rotate the board!',
  'that\'s Wangernumb. time to rotate the board!',
];
const outros = [
  'that\'s all we have time for today. good Numberwang!',
  'remember to stay Numberwang. good Numberwang!',
  'we\'re out of numbers today, we\'ll be back again with half as many. good Numberwang!',
];
const thatsnumberwang = [
  'that\'s Numberwang!',
  'that\'s Numberwang!',
  'that\'s Numberwang!',
  'yep, that\'s Numberwang!',
  'oohhh, that\'s Numberwang!',
  'yes! Numberwang!',
  'Numberwang!',
  'that\'s Numberwang, let\'s go to the maths board!',
  'that\'s the bonus Numberwang, triple Numberwang!',
];
const thatswangernumb = [
  'that\'s Wangernumb!',
];
const introductions = [
  [
    'who likes ducks',
    'who likes chickens',
  ],
  [
    'who is from the internet',
    'who is also from the internet',
  ],
  [
    'who doesn\'t know today\'s answers',
    'who does',
  ],
  [
    'eating a taco',
    'eating a burrito',
  ],
  [
    'promoting equality',
    'promiting exactness',
  ],
  [
    'who is from Durham',
    'who is from space',
  ],
  [
    'who is from Yorkshire',
    'who is from a factory and is made from a special metal',
  ],
];

export default class Numberwang extends Addon {
  id = 'numberwang';
  name = 'Numberwang!';
  description = 'Numberwang is the maths quiz that simply everyone is talking about';
  version = '9.0.0';

  private difficulty = 5;
  private servers = new Map<string, NwGame>();

  constructor(bot) {
    super(bot);
  }

  async start() {
    // tslint:disable max-line-length
    this.addCommand(new Command('numberwang', this.doNumberwang, this));
    this.addCommand(new Command('nw', this.doNumberwang, this));
    // tslint:enable max-line-length

    return true;
  }

  async doNumberwang(input: Input) {
    let str;
    const arg = input.args[0];
    if (arg.match(/^\d+$/)) {
      const sid = input.message.server.id;
      if (this.servers.has(sid)) {
        str = this.giveResponse(input);
      } else {
        // tslint:disable-next-line:max-line-length
        str = 'Numberwang\'s taking a quick break. we\'ll be back before you can think \'Numberwang\'!';
      }
    } else if (arg.toLowerCase() === 'start') {
      str = this.startNw(input);
    }

    return new TextSendable(str);
  }

  startNw(input: Input) {
    const sid = input.message.server.id;
    if (this.servers.has(sid)) {
      const conf = this.servers.get(sid);
      // If one player, start the game
      if (conf.players.length === 1) {
        // Ensure player isn't already in the game
        if (conf.players[0].id === input.user.id) {
          return `you're already in the game, ${input.user.name}. we need another contestant`;
        }

        // Add player
        conf.players.push(input.user);

        // And introduce the game
        return [
          arrayRandom(intros),
          'today\'s initial contestants are:',
          ...this.introduce(conf.players),
          'others may join as we continue the show',
          'we\'ll start with whoever is the fastest typer',
        ].join('\n');
      } else {
        if (conf.players.find(u => u.id === input.user.id)) {
          return `you're already playing, ${input.user.name}`;
        }

        conf.players.push(input.user);
        return `just start guessing, ${input.user.name}! \`~nw <number>\``;
      }
    } else {
      const conf: NwGame = {
        players: [input.user],
        lastId: null,
        diff: this.difficulty,
        rounds: Math.floor(Math.random() * 4) + 2,
        wn: false,
      };

      this.servers.set(sid, conf);

      return 'we\'ll need another contestant before we can get started with Numberwang';
    }
  }

  introduce(players: User[]) {
    const lines = arrayRandom(introductions);
    return [
      `${players[0].name} ${lines[0]}`,
      `${players[1].name} ${lines[1]}`,
    ];
  }

  giveResponse(input: Input) {
    const sid = input.message.server.id;
    const conf = this.servers.get(sid);

    let user = conf.players.find((u) => {
      return u.id === input.user.id;
    });

    if (!user) {
      user = input.user;
      conf.players.push(user);
    }

    if (conf.lastId === user.id) {
      return `wait your turn, ${user.name}`;
    }

    conf.lastId = user.id;

    // Yep, the entire thing is based on chance. No rhyme or reason.
    // Just like the original.
    if (Math.floor(Math.random() * conf.diff) === 0) {
      // Round is over, so reduce it
      conf.rounds -= 1;
      // Reduce the difficulty (so Numberwang is more likely)
      conf.diff = Math.max(2, conf.diff - 0.5);

      // Check to see if it's Wangernumb time
      if (conf.rounds <= 0) {
        if (conf.wn) {
          // Game is over
          this.servers.delete(sid);
          return [
            `${user.name} ${arrayRandom(thatswangernumb)}`,
            `today's winner was ${arrayRandom(conf.players).toString()}. congratulations!`,
            arrayRandom(outros),
          ].join('\n');
        } else {
          // Enter Wangernumb and reset difficulty
          conf.wn = true;
          conf.diff = this.difficulty;
          return `${user.name} ${arrayRandom(wangernumbs)}`;
        }
      } else {
        // Reset difficulty
        conf.diff = this.difficulty;
        return `${user.name} ${arrayRandom(thatsnumberwang)}`;
      }
    }
  }
}
