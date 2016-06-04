'use strict';
var Discordie = require('discordie');
var config = require('./main.conf.json');
var Bot = require('./obj/Bot.js');

var discord = new Discordie();
var bot = new Bot(discord, config);

bot.start();
