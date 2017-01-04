const http = require('http');
const https = require('https');
const url = require('url');
const robots = require('robots');

const parsers = new Map();
const UA = '[BOT] secret_bot/7.x.x - https://secretonline.co/bot/user-agent/';

function req(reqObj, bypass) {
  let prom = new Promise((resolve, reject) => {
    // Perform some checks before continuing
    // Ensure request is an object
    if (typeof reqObj === 'string') {
      reqObj = url.parse(reqObj);
    }

    // Set user agent
    if (!reqObj.headers) {
      reqObj.headers = {};
    }
    reqObj.headers['User-Agent'] = UA;

    resolve(reqObj);
  });

  if (bypass !== 'yes, i really want to bypass robots.txt') {
    prom = prom.then(checkRobots);
  }

  prom = prom.then(doRequest);

  return prom;
}

function checkRobots(reqObj) {
  return new Promise((resolve, reject) => {
    if (parsers.has(reqObj.host.toLowerCase())) {
      let p = parsers.get(reqObj.host.toLowerCase());

      p.canFetch('secret_bot', reqObj.pathname, (access) => {
        if (access) {
          resolve(reqObj);
        } else {
          reject(new Error(`robots.txt check failed for ${reqObj.href}`));
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
            reject(new Error(`robots.txt check failed for ${reqObj.href}`));
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
      reject(new Error(`unknown protocol "${reqObj.protocol}" on request to ${reqObj.href}`));
      return;
    }

    mod.get(reqObj, (res) => {
      if (res.statusCode !== 200) {
        let err = new Error(`invalid response code: "${res.statusCode}" on request to ${reqObj.href}`);
        err.code = res.statusCode;
        reject(err);
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
    }).on('error', (err) => {
      reject(err);
      return;
    });
  });
}

module.exports = req;
