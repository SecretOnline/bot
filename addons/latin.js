const ScriptAddon = require('../bot/ScriptAddon.js');

class Latin extends ScriptAddon {
  constructor(bot) {
    super(bot, 'latin');

    this.desc = 'Adds some text transformations. These commands were among the first added to secret_bot';
  }

  init() {
    this.addCommand('secret_latin', this.getSecretText);
    this.addCommand('trk_latin', this.getTrkText);
    this.addCommand('jaden_latin',this.getJadenText);
    this.addCommand('alvv_latin', this.getAlvvText);
    this.addCommand('ohdear_latin', this.getMessText);
    this.addCommand('ohfuck_latin', this.getFuckText);
    this.addCommand('wunter', this.getWunter);
  }

  getSecretText(input) {
    return input.process()
      .then((result) => {
        return this.getSecretLatin(result.text);
      });
  }

  getTrkText(input) {
    return input.process()
      .then((result) => {
        return this.getTrkLatin(result.text);
      });
  }

  getJadenText(input) {
    return input.process()
      .then((result) => {
        return this.toTitleCase(result.text);
      });
  }

  getAlvvText(input) {
    return input.process()
      .then((result) => {
        return this.getAlvvLatin(result.text);
      });
  }

  getMessText(input) {
    return input.from(`~secret_latin ~trk_latin ~jaden_latin ${input.text}`)
      .process();
  }

  getFuckText(input) {
    return input.from(`~flip ~ohdear_latin ${input.text}`)
      .process();
  }

  getWunter(input) {
    return input.process()
      .then((result) => {
        return result.toLowerCase().replace(/[gr]/, 'w');
      });
  }

  /* "Latin" */
  getAlvvLatin(string) {
    var words = string.split(' ');
    for (var i = 0; i < words.length; i++) {
      if (words[i].match(/<@!?\d+>/)) {
        words[i] = '<@83819945497985024>';
        continue;
      }
      if (words[i].length > 3) {
        if (words[i].indexOf('ing') === words[i].length - 3) {
          words[i] = 'alvving';
        } else if (words[i].indexOf('ed') === words[i].length - 2) {
          words[i] = 'alvved';
        } else if (words[i].indexOf('er') === words[i].length - 2) {
          words[i] = 'alvver';
        } else if (words[i].indexOf('n\'t') === words[i].length - 3) {
          words[i] = 'alvvn\'t';
        } else if (words[i].indexOf('nt') === words[i].length - 2) {
          words[i] = 'alvvnt';
        } else if (words[i].indexOf('\'s') === words[i].length - 2) {
          words[i] = 'alvv\'s';
        } else if (words[i].indexOf('es') === words[i].length - 2) {
          words[i] = 'alvves';
        } else if (words[i].indexOf('s') === words[i].length - 1) {
          words[i] = 'alvvs';
        } else if (words[i].indexOf('y') === words[i].length - 1) {
          words[i] = 'alvvy';
        } else {
          words[i] = 'alvv';
        }
      }
    }
    return words.join(' ');
  }

  getSecretLatin(string) {
    var words = string.split(' ');
    for (var i = 0; i < words.length; i++) {
      if (words[i].length > 2) {
        words[i] = words[i].substring(1, 2) + words[i].substring(0, 1) + words[i].substring(2);
      }
    }
    return words.join(' ');
  }

  getTrkLatin(string) {
    var newString = string.replace(/[aeiouc]/gi, '');
    return newString;
  }

  /**
   * Quick title case
   */
  toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }
}

module.exports = Latin;
