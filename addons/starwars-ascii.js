const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');
const Animation = require('../bot/Animation.js');
const {delay} = require('../util');

class StarWars extends ScriptAddon {
  constructor(bot) {
    super(bot, 'sw-ascii');

    let fps = 10;
    this.interval = fps / 1000;

    this.animPromise = this.createAnimation();
  }

  get description() {
    return 'play the star wards ASCII animation from http://www.asciimation.co.nz/';
  }

  init() {
    this.addCommand('sw-ascii', this.playAnimation, Command.PermissionLevels.ADMIN);
  }

  createAnimation() {
    return this.getData()
      .then((data) => {
        let frames = [];
        while (data.length > 0) {
          frames.push(data.splice(0, 14));
        }
        return frames.map((frame) => {
          let time = Number.parseInt(frame.splice(0, 1)[0]);
          return {
            time,
            lines: frame
          };
        });
      })
      .then((frames) => {
        let frameFunctions = frames.map((frame, index) => {
          let period = 0;
          if (index > 0) {
            period = frames[index - 1];
          }
          let time = period * this.interval;

          let str = `\`\`\`\n${frame.lines.join('\n')}\n\`\`\``;

          return () => Promise
            .all([
              Promise.resolve(str),
              delay(time)
            ])
            .then(r => r[0]);
        });

        // Modified version of promiseChain util function
        let animPromises = [];
        frameFunctions
          .reduce((prom, nextFunc, index) => {
            // First: do translations in order
            let frameProm = prom
              .then(res => nextFunc(res));
            animPromises.push(frameProm);
            return frameProm;
          }, Promise.resolve());
        
        return new Animation(animPromises, this.interval, '#FFFF00');
      });
  }

  playAnimation(input) {
    return Promise.all([
      input.process(),
      this.animPromise
    ])
      .then(([res, anim]) => {
        res.add(anim);
        return res;
      });
  }
}

module.exports = StarWars;
