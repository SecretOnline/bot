// var delays = [];

var delayHelp = [
  'syntax: `~delay <time in ms> <commands/words to process>`',
  'processes the remainder of the text, then waits the defined time to output it',
  'this differs from `~predelay`, which waits and *then* processes',
  'example usage:',
  '~delay 1000 this appears one second later'
];
var predelayHelp = [
  'syntax: `~predelay <time in ms> <commands/words to process>`',
  'takes a number representing the time to wait in milliseconds, and some text to output',
  'waits the time, then processes the remainder of the text',
  'this differs from `~delay`, which processes first, and then waits',
  'example usage:',
  '~predelay 1000 this appears one second later'
];

function init(bot) {
  bot.registerCommand('delay', new bot.Command(doDelay, 'default', delayHelp));
  bot.registerCommand('predelay', new bot.Command(doPreDelay, 'default', predelayHelp));
}

function doDelay(input) {
  return input.process()
    .then((result) => {
      return new Promise(function(resolve, reject) {
        var n;
        var parts = result.split(' ');
        try {
          n = Number.parseInt(parts.splice(0, 1)[0]);
        } catch (e) {
          reject('unable to delay, must have number');
          return;
        }
        setTimeout(function() {
          resolve(parts.join(' '));
        }, n);
      });
    });
}

function doPreDelay(input) {
  return new Promise((resolve, reject) => {
    var n;
    var parts = input.raw.split(' ');
    try {
      n = Number.parseInt(parts.splice(0, 1)[0]);
    } catch (e) {
      reject('unable to delay, must have number');
      return;
    }
    setTimeout(() => {
      input.from(parts.join(' ')).process()
        .then((result) => {
          resolve(result);
        });
    }, n);
  });
}

module.exports = {
  init: init
};
