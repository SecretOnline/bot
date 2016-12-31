// This addon only works for Discord at the moment
const url = require('url');

const Discord = require('discord.js');
const snoowrap = require('snoowrap');

const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');
const request = require('../util/').request;

let redditHelp = [
  'Gets info about a reddit thread or comment'
];

class Summaries extends ScriptAddon {
  constructor(bot) {
    super(bot, 'summaries');

    // TODO: Create reddit wrapper
  }

  init() {
    this.bot.addCommand('reddit-summary', new Command(this.redditSummary.bind(this), 'summaries', redditHelp));
  }

  deinit() {
    // Do nothing
  }

  redditHelp(input) {
    
  }
}

module.exports = Summaries;
