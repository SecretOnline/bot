const ScriptAddon = require('../bot/ScriptAddon.js');

class StarWars extends ScriptAddon {
  constructor(bot) {
    super(bot, 'sw-ascii');

    this.animPromise = this.createAnimation();
  }

  get description() {
    return 'play the star wards ASCII animation from http://www.asciimation.co.nz/';
  }

  init() {

  }

  createAnimation() {
    this.getData()
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
      });
  }
}

module.exports = StarWars;
