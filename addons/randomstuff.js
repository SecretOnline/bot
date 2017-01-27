const url = require('url');

const ScriptAddon = require('../bot/ScriptAddon.js');
const request = require('../util/').request;

let uselessHelp = [
  'Gives you a random website from The Useless Web',
  'Original site: http://www.theuselessweb.com/'
];

class RandomStuff extends ScriptAddon {
  constructor(bot) {
    super(bot, 'randomstuff');

    this.theuselessweb = [];
    this.foaasCache = [];
    this.uselessWebTimeout = false;
    this.foaasTimeout = false;
    this.loadUselessWeb();
    this.loadFoaas();

    this.mahnaStage = 0;
  }

  init() {
    this.addCommand('theuselessweb', this.uselessWeb, uselessHelp);
    this.addCommand('randomcat', this.randomCat);
    this.addCommand('randomdog', this.randomDog);
    this.addCommand('mahnamahna', this.mahnamahna, 'https://www.youtube.com/watch?v=8N_tupPBtWQ');
    this.addCommand('foaas', this.foaas, this.foaasList);
    this.addCommand('httpcat', this.httpcat);
  }

  loadUselessWeb() {
    request('http://www.theuselessweb.com/js/uselessweb.js?v=1')
      .then((res) => {
        let match = res.match(/sitesList = (\[[\w\W\r\n]*?\]);/);
        if (match) {
          try {
            let m = match[1].replace(/'/g, '"');
            this.theuselessweb = JSON.parse(m);
          } catch (e) {
            // do nothing on error
          }
        }
      }, (err) => {
        this.log(err);
      });
    this.uselessWebTimeout = setTimeout(() => {
      this.uselessWebTimeout = false;
    }, 43200000);
  }

  loadFoaas() {
    let reqObj = url.parse('https://www.foaas.com/operations');
    reqObj.headers = {Accept:'application/json'};
    request(reqObj)
      .then(JSON.parse)
      // Only keep those with arguments
      .then(r=>r.filter(i=>i.url.match(/\/(\w+)\//)))
      .then((res) => {
        this.foaasCache = res;
      }, (err) => {
        this.log(err);
      });
    this.foaasTimeout = setTimeout(() => {
      this.foaasTimeout = false;
    }, 43200000);
  }

  uselessWeb(input) {
    if (!this.uselessWebTimeout) {
      this.loadUselessWeb();
    }

    if (this.theuselessweb.length === 0) {
      throw new Error('secret_bot is still loading The Useless Web');
    }

    let arr = this.theuselessweb;

    // TODO: Add option to have flash enabled pages too
    arr = this.theuselessweb.filter(i => !i[1]);

    let entry = arr[Math.floor(Math.random() * arr.length)];

    let res = entry[0];
    if (entry[1]) {
      res += ' (requires Flash)';
    }

    return res;
  }

  randomCat(input) {
    return request('http://random.cat/meow')
      .then(JSON.parse)
      .then((res) => {
        return res.file;
      });
  }

  randomDog(input) {
    return request('http://random.dog', 'yes, i really want to bypass robots.txt')
      .then((res) => {
        let match = res.match(/<img src='([\w-_.]+\.\w+)'/);
        if (match) {
          return `http://random.dog/${match[1]}`;
        }
      });
  }

  mahnamahna(input) {
    let res;

    switch (this.mahnaStage) {
      case 0:
        res = 'doo *dooooo* do do doo';
        break;
      case 1:
        res = 'doo do do *doo*';
        break;
      case 2:
        res = 'doo *dooooo* do do doo. do do doo. do do doo. do do do do do *doo doo dooooo* do';
        break;
      default:
        res = 'you broke it';
    }

    this.mahnaStage = (this.mahnaStage + 1) % 3;

    return res;
  }

  foaas(input) {
    if (!this.foaasTimeout) {
      this.loadFoaas();
    }

    return input.process()
      .then((res) => {
        return new Promise((resolve, reject) => {
          let parts = res.split(' ');
          if (!parts.length) {
            reject('you need to specify which method of FOAAS you want to use. use `~help foaas` for more information');
            return;
          }

          let type = parts.shift();
          let service = this.foaasCache.find(a => (a.name === type) || (a.url.match(new RegExp(`^\\/${type}\\/.*$`))));
          if (!service) {
            reject('the service type was not recognised. use `~help foaas` for more information');
            return;
          }

          if (service.fields.length > parts.length) {
            reject(`${type} requires ${service.fields.length} additionals arguments, but you gave ${parts.length}`);
            return;
          }

          let foaasUrl = service.url.match(/\/(\w+)\//)[1];
          service.fields.forEach((field, index) => {
            foaasUrl += `/${parts[index]}`;
          });

          let reqObj = url.parse(`https://www.foaas.com/${foaasUrl}`);
          reqObj.headers = {Accept:'application/json'};
          resolve(reqObj);
        })
        .then(request)
        .then(JSON.parse)
        .then(r=>`${r.message}\n${r.subtitle}`);
      });
  }

  foaasList(input) {
    let arr =  this.foaasCache
      .map((service) => {
        let urlName = service.url.match(/\/(\w+)\//)[1];
        return `${urlName}: (${service.fields.length}) ${service.fields.map(f=>f.name).join(', ')}`;
      });

    arr.unshift('syntax: `~foaas <type> [arguments]`', 'Fuck Of As A Servive - https://www.foaas.com/', 'below is a list of all the services supported', '`<type>`: (<number of arguments needed>) [list of arguments]', '');
    return arr.join('\n');
  }

  httpcat(input) {
    // regex generated from list of status codes that
    let match = input.text.match(/^10[01]|20[0-2467]|30[0-57]|4(?:44|31|2[0-69]|1[0-8]|0[0-689]|5[01])|5(?:99|0[02-46-9]|11)$/);
    if (!match) {
      throw `${input.text} is not an HTTP status code`;
    }

    return `https://http.cat/${input.text}.jpg`;
  }

}

module.exports = RandomStuff;
