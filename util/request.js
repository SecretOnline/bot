const http = require('http');
const https = require('https');
const url = require('url');

function req(reqObj) {
  return new Promise((resolve, reject) => {
    if (!reqObj.match(/^https?:\/\//)) {
      reject('only http and https requests are allowed');
      return;
    }

    if (typeof reqObj === 'string') {
      reqObj = url.parse(reqObj);
    }

    if (!reqObj.headers) {
      reqObj.headers = {};
    }
    reqObj.headers['User-Agent'] = '[BOT] secret_bot/7.x.x - https://github.com/SecretOnline/bot';

    let mod;
    if (reqObj.protocol.match(/^http:/)) {
      mod = http;
    }
    if (reqObj.protocol.match(/^https:/)) {
      mod = https;
    }

    if (!mod) {
      reject('unable to figure out which protocol to use');
      return;
    }

    mod.get(reqObj, (res) => {
      if (res.statusCode !== 200) {
        reject('invalid response code');
        res.resume();
        return;
      }

      let data = '';

      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        data += chunk;
      }).on('end', () => {
        resolve(data);
      });
    }).on('error', () => {
      reject('error making request');
      return;
    });
  });
}

module.exports = req;
