const http = require('http');
const https = require('https');

function req(url) {
  return new Promise((resolve, reject) => {
    if (!url.match(/^https?:\/\//)) {
      reject('only http and https requests are allowed');
      return;
    }

    let mod;

    if (url.match(/^http:/)) {
      mod = http;
    }
    if (url.match(/^https:/)) {
      mod = https;
    }

    if (!mod) {
      reject('unable to figure out which protocol to use');
      return;
    }

    mod.get(url, (res) => {
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
