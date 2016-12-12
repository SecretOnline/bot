const http = require('http');
const https = require('https');
const url = require('url');

const robots = new Map();
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

    return reqObj;
  })
  .then(checkRobots)
  .then(doRequest);
}

// Portions of this robots checker is from https://github.com/ekalinin/robots.js
// Thanks to @ekalinin for that
function checkRobots(reqObj) {
  return new Promise((resolve, reject) => {
    // Check cached version first
    if (robots.has(reqObj.host.toLowerCase())) {
      if (robots.get(reqObj.host.toLowerCase())) {
        resolve(reqObj);
        return;
      } else {
        reject('robots.txt check failed');
        return;
      }
    }

    // Make a request for the site's robots.txt
    let path = reqObj.pathname;
    let nReq = url.resolve(url.format(reqObj), '/robots.txt');
    if (!nReq.headers) {
      nReq.headers = {};
    }
    nReq.headers['User-Agent'] = UA;

    // Request site's robots.txt
    doRequest(nReq)
      .then((file) => {
        let lines = file.split(/\r?\n/);
        let allowed = true;
        let isUA = false;

        for (let i = 0; i < lines.length; i++) {
          let line = lines[i];

          let c = line.indexOf('#');
          line = line.substring(0, c);

          let arr = line.split(':');
          if (arr.length !== 2) {
            continue;
          }

          let field = arr[0].trim().toLowerCase();
          let value = arr[1].trim();

          switch (field) {
            case 'user-agent':
              if (field.match(/\*|secret_bot/)) {
                isUA = true;
              } else {
                isUA = false;
              }
              break;
            case 'allow':
              if (isUA) {
                if (path.match(value)) {
                  allowed = true;
                }
              }
              break;
            case 'disallow':
              if (isUA) {
                if (path.match(value)) {
                  allowed = false;
                }
              }
              break;
            default:
              // Unsupported option, just ignore it
              break;

          }
        }

        if (allowed) {
          robots.set(reqObj.host.toLowerCase(), true);
          resolve(reqObj);
        } else {
          robots.set(reqObj.host.toLowerCase(), false);
          reject('robots.txt check failed');
        }
      }, () => {
        // If request fails, assume it's because of a 404, and continue on to real request
        return reqObj;
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
