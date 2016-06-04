'use strict';

var fs = require('fs');

var _bot;
var roleLists = {};
var watcher;
var dataLocation = './data/role-switcher.json';

function init(bot) {
  _bot = bot;

  _bot.registerCommand('join-role', new _bot.Command(joinRole, 'roles'));
  _bot.registerCommand('leave-role', new _bot.Command(leaveRole, 'roles'));
  _bot.registerCommand('add-role', new _bot.Command(addRole, 'roles', _bot.Command.PermissionLevels.ADMIN));


  roleLists = JSON.parse(fs.readFileSync(dataLocation)) || {};

  watcher = fs.watch(dataLocation, (event, filename) => {
    if (event === 'change') {
      fs.readFile(dataLocation, (err, data) => {
        if (err) {
          console.error(`[Error] reading ${dataLocation}`);
          console.error(err);
          return;
        }

        try {
          roleLists = JSON.parse(data);
          console.log('reloaded roles');
        } catch (err) {
          console.error(`[Error] parsing servers ${dataLocation}`);
          console.error(err);
          return;
        }
      });
    }
  });
}

function deinit() {
  watcher.close();
}

function joinRole(input) {
  return input.process()
    .then((result) => {
      return new Promise((resolve, reject) => {
        var server = input.originalMessage.guild;
        var allowedRoles = roleLists[server.id] || [];

        var requestedRole = server.roles.find((role) => {
          return result.toLowerCase() === role.name.toLowerCase() && allowedRoles.indexOf(role.id) > -1;
        });

        if (requestedRole) {
          var user = server.members.find((user) => {
            return user.id === input.originalMessage.author.id;
          });
          user.assignRole(requestedRole)
            .then(() => {
              resolve(`gave ${requestedRole.name} to ${user.mention}`);
            }, (err) => {
              console.error(`error adding role ${requestedRole.name} to ${user.username}`);
              console.error(err);
              reject();
            });
        } else {
          resolve('role not found/not allowed');
        }
      });
    });
}

function leaveRole(input) {
  return input.process()
    .then((result) => {
      return new Promise((resolve, reject) => {
        var server = input.originalMessage.guild;
        var allowedRoles = roleLists[server.id] || [];

        var requestedRole = server.roles.find((role) => {
          return result.toLowerCase() === role.name.toLowerCase() && allowedRoles.indexOf(role.id) > -1;
        });

        if (requestedRole) {
          var user = server.members.find((user) => {
            return user.id === input.originalMessage.author.id;
          });
          user.unassignRole(requestedRole)
            .then(() => {
              resolve(`removed ${requestedRole.name} from ${user.mention}`);
            }, (err) => {
              console.error(`error adding role ${requestedRole.name} to ${user.username}`);
              console.error(err);
              reject();
            });
        } else {
          resolve('role not found/not allowed');
        }
      });
    });
}

function addRole(input) {
  return input.process()
    .then((result) => {
      var server = input.originalMessage.guild;
      var allowedRoles = roleLists[server.id] || [];

      var requestedRole = server.roles.find((role) => {
        return result.toLowerCase() === role.name.toLowerCase();
      });

      if (requestedRole) {
        console.log(`have role ${requestedRole.name}`);
        if (allowedRoles.indexOf(requestedRole.id) > -1) {
          return `${requestedRole.name} is already in the roles list`;
        } else {
          allowedRoles.push(requestedRole.id);
          roleLists[server.id] = allowedRoles;
          fs.writeFile(dataLocation, JSON.stringify(roleLists, null, 2));

          return `added ${requestedRole.name} to allowed roles`;
        }
      } else {
        return 'role not found';
      }
    });
}

function removeRole(input) {
  return input.process()
    .then((result) => {
      var server = input.originalMessage.guild;
      var allowedRoles = roleLists[server.id] || [];

      var requestedRole = server.roles.find((role) => {
        return result.toLowerCase() === role.name.toLowerCase();
      });

      if (requestedRole) {
        console.log(`have role ${requestedRole.name}`);
        if (allowedRoles.indexOf(requestedRole.id) > -1) {
          allowedRoles.splice(allowedRoles.indexOf(requestedRole.id), 1);
          roleLists[server.id] = allowedRoles;
          fs.writeFile(dataLocation, JSON.stringify(roleLists, null, 2));

          return `removed ${requestedRole.name} from allowed roles`;

        } else {
          return `${requestedRole.name} is already in the roles list`;
        }
      } else {
        return 'role not found';
      }
    });
}

module.exports = {
  init: init,
  deinit: deinit
};
