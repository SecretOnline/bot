'use strict';
var fs = require('fs');

var nwHelp = [
  'syntax: `~<nw/numberwang> <a number>`',
  'use `~numberwang start` to begin a round',
  'plays a game of Numberwang (https://www.youtube.com/watch?v=qjOZtWZ56lc)',
  'what is Numberwang?',
  'Numberwang is the maths quiz that simply everyone is talking about'
];

// Some bits of text to throw in
var intros = [
  'welcome back to Numberwang, the maths quiz that simply everyone is talking about',
  'it\'s time for Numberwang, the maths quiz show that everyone\'s talking about',
  'hello! you\'re watching Numberwang, the maths quiz show that simply everyone'
];
var wangernumbs = [
  'it\'s time for Wangernumb! let\'s rotate the board!',
  'that\'s today\'s Wangernumb. rotate the board!',
  'that\'s Wangernumb. time to rotate the board!'
];
var outros = [
  'that\'s all we have time for today. good Numberwang!',
  'remember to stay Numberwang. good Numberwang!',
  'we\'re out of numbers today, we\'ll be back again with half as many. good Numberwang!'
];
var thatsnumberwang = [
  'that\'s Numberwang!',
  'that\'s Numberwang!',
  'that\'s Numberwang!',
  'yep, that\'s Numberwang!',
  'oohhh, that\'s Numberwang!',
  'yes! Numberwang!',
  'Numberwang!'
];
var thatswangernumb = [
  'that\'s Wangernumb!'
];
var introductions = [
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

var _bot;
var servers = {};
var difficulty = 5;


function init(bot) {
  _bot = bot;

  bot.registerCommand('nw', new bot.Command(doNumberwang, 'numberwang', nwHelp));
  bot.registerCommand('numberwang', new bot.Command(doNumberwang, 'numberwang', nwHelp));
}

function doNumberwang(input) {
  var sid = input.originalMessage.guild.id;
  var arg = input.raw.split(' ')[0];
  var num;
  try {
    num = Number.parseFloat(arg);
  } catch (e) {
    num = null;
  }
  if (!(num === null || isNaN(num))) {
    if (servers[sid]) {
      return giveResponse(input);
    } else {
      return 'Numberwang\'s taking a quick break. we\'ll be back before you can think \'Numberwang\'!';
    }
  } else {
    if (arg.toLowerCase() === 'start') {
      return startNw(input);
    }
  }
}

function startNw(input) {
  var sid = input.originalMessage.guild.id;
  var uid = input.user.id;
  if (servers[sid]) {
    if (servers[sid].players.length === 1) {
      if (servers[sid].players[0].id === input.user.id) {
        return;
      }

      servers[sid].players.push(input.user);
      return [
        randomFromArray(intros),
        'today\'s initial contestants are:',
        ...introduce(servers[sid].players),
        'others may join as we continue the show',
        'we\'ll start with whoever is the fastest typer'
      ].join('\n');
    } else {
      return `just start guessing, ${input.user.mention}`;
    }
  } else {
    var conf = {
      players: [input.user],
      lastId: 0,
      diff: difficulty,
      rounds: Math.floor(Math.random() * 4) + 2,
      wn: false
    };
    servers[sid] = conf;
    return 'we\'ll need another contestant before we can get started with Numberwang';
  }
}

function introduce(players) {
  var lines = randomFromArray(introductions);
  return [
    `${players[0].mention} ${lines[0]}`,
    `${players[1].mention} ${lines[1]}`
  ];
}

function giveResponse(input) {
  var sid = input.originalMessage.guild.id;
  var conf = servers[sid];

  var user = conf.players.find((u) => {
    return u.id === input.user.id;
  });

  if (!user) {
    user = input.user;
    conf.players.push(user);
  }

  if (conf.lastId === user.id) {
    return `wait your turn, ${user.mention}`;
  }

  conf.lastId = user.id;

  if (Math.floor(Math.random() * conf.diff) === 0) {
    var newPoints = _bot.getPoints(input.user, input.originalMessage.guild);
    _bot.setPoints(input.user, input.originalMessage.guild, newPoints);

    conf.rounds--;
    conf.diff = Math.max(2, conf.diff - 0.5);
    if (conf.rounds <= 0) {
      if (conf.wn) {
        servers[sid] = undefined;
        return [
          `${user.mention} ${randomFromArray(thatswangernumb)}`,
          `today's winner was ${randomFromArray(conf.players).mention}. congratulations!`,
          randomFromArray(outros)
        ].join('\n');
      } else {
        conf.wn = true;
        return `${user.mention} ${randomFromArray(wangernumbs)}`;
      }
    } else {
      conf.diff = difficulty;
      return `${user.mention} ${randomFromArray(thatsnumberwang)}`;
    }
  }
}

function randomFromArray(arr) {
  var index = Math.floor(Math.random() * arr.length);
  return arr[index];
}

module.exports = {
  init: init
};
