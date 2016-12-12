const http = require('http');
const https = require('https');
const url = require('url');
const robots = require('robots');

const parsers = new Map();
const UA = '[BOT] secret_bot/7.x.x - https://github.com/SecretOnline/bot';

function req(reqObj) {
  return new Promise((resolve, reject) => {
    // Perform some checks before continuing
    // Ensure request is an object
    if (typeof reqObj === 'string') {
      reqObj = url.parse(reqObj);
    }

    // Check protocols
    if (!reqObj.protocol.match(/^https?:/)) {
      reject('only http and https requests are allowed');
      return;
    }

    // Set user agent
    if (!reqObj.headers) {
      reqObj.headers = {};
    }
    reqObj.headers['User-Agent'] = UA;

    resolve(reqObj);
  })
  .then(checkRobots)
  .then(doRequest);
}

function checkRobots(reqObj) {
  return new Promise((resolve, reject) => {
    if (parsers.has(reqObj.host.toLowerCase())) {
      let p = parsers.get(reqObj.host.toLowerCase());

      p.canFetch('secret_bot', reqObj.pathname, (access) => {
        if (access) {
          resolve(reqObj);
        } else {
          reject('robots.txt check failed');
        }
      });
      return;
    }

    let parser = new robots.RobotsParser();
    parser.setUrl(url.resolve(url.format(reqObj), '/robots.txt'), function(parser, success) {
      if(success) {
        parser.canFetch('secret_bot', reqObj.pathname, (access) => {
          if (access) {
            resolve(reqObj);
          } else {
            reject('robots.txt check failed');
          }
        });
      } else {
        // If robots.txt isn't found, allow requests
        resolve(reqObj);
      }
    });
  });
}

function doRequest(reqObj) {
  return new Promise((resolve, reject) => {
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
