// var delays = [];

function init(bot) {
  bot.registerCommand('delay', new bot.Command(doDelay, 'default'));
  bot.registerCommand('predelay', new bot.Command(doPreDelay, 'default'));
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
