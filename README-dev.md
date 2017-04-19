# secret_bot

This page is for people who want to help make secret_bot. If you just want to use secret_bot on your server, you should read [README.md](https://github.com/SecretOnline/bot/blob/master/README.md) instead.

## Getting this project going

```
$ git clone https://github.com/SecretOnline/bot.git
$ cd bot && npm install
```

You now need to add a couple of configuration files.

#### bot.conf.json

```js
{
  "token": "your discord bot token",
  "bot": { // This section is sent to the bot
    "paths": { // You'll probably want to use these defaults
      "addons": "addons/",
      "connections": "connections/",
      "conf": "conf/",
      "logs": "logs/",
      "users": "users/"
    },
    "always-enabled": [] // list of addons that are always enabled
    "color": {
      "normal": "#7289DA", // color of normal replies
      "error": "#E8261D", // color of error messages
      "action": "#FDFF88" // color of the 'ReAction' embeds
    },
    "overlords": [
      "a list of user IDs that can run all commands all the time"
    ]
  }
}

```

#### conf/default.conf.json

```js
{
  "name": "", // not actually needed here, but some addons might end up using it
  "prefix": "~", // the character that servers will use at the beginning of commands by default
  "color": "#7289DA", // a colour for most Discord embeds
  "addons": [], // a list of command groups that are added to servers by default
  "addon-conf": {} // an empty object, just keep it here for safety
}

```

Now you should be able to just run the bot. Some addons will require default configuration defined in the `addon-conf` section of `conf/default.conf.json`. This is often used for API keys, since they aren't required to be different for each server.

```
$ node index.js
```

Note: Many addons will not load due to missing configuration. Documentation for each addon will come eventually, hopefully.

## Why another rewrite?

Version 7 builds upon the ability for commands to access the rest of the bot, so a command can [call another command](https://github.com/SecretOnline/bot/commit/ae5281902341a43902b0158bc9f4f7c5fa27c497#diff-051ac24927ac63174d3fd41cdf2098eaR123). It also means they can do more than just return text, they can have [other side effects as well](https://github.com/SecretOnline/bot/commit/67c195c59aa970058f3f73dc009d893e3d998e53#diff-d62dce5120621199a95203fd01539030R212). Commands also have a group, which allows server admins to enable/disable groups of commands if they want/don't want them.

It also has a more formal help system, meaning it is easier to find out about a particular command.

The permissions system has been simplified. When an addon creates a command, it can specify one of three permission levels. **DEFAULT** is the default level, and means that this command can be run by anyone with typing permission. **ADMIN** refers to anyone with the Manage Server permission on the Discord server. **OVERLORD** means the owner of the bot, specified in the main bot configuration. Since permissions are done per-server, you might be able to run some commands on one server, but not on another.

Finally, secret_bot can be used on multiple Discord servers. Each server has its own configuration.

## Adding an addon

Addons come in two forms: JSON and JS.

### JSON

Any JSON files in the `./addons/` directory will get loaded by the bot.

```json
{
  "trigger": "response"
}
```

The `trigger` is the name of the command. It is called by typing `~trigger` in the chat, and will give the reponse back. Like with commands created with `~add-command`, if the response contains `{args}`, that will be replaced by the text that follows the command in the original message. Likewise, `{user}` will be replaced by the user's name.

```js
// cool.json
{
  "realbest": "the real {args}, the best {args}"
}
```
```
// In Discord
secret_online: ~realbest responses
<- the real responses, the best responses
```

Commands loaded by JSON are added to a command group with the same name as the file. e.g. commands in `cool.json` will be in the `cool` group.

### JS

Any javascript files in the `./addons/` directory will also be loaded.

Version 7 changes script loading in a breaking way from v6. Old v6 modules will not load (but also won't crash the bot).

Script files must be valid Node.js modules, and should export a class that [extends `ScriptAddon`](https://github.com/SecretOnline/bot/blob/17c6ab52c1b64afe7485edc5e79ece79214deb79/addons/core.js#L3)

This differs from previous versions of secret_bot, where commands were directly specified in the module's exports.

```js
const ScriptAddon = require('../bot/ScriptAddon');
class YourCoolAddon extends ScriptAddon {
  // ...
}
module.exports = YourCoolAddon;
```

Each addon must have two functions: `init` and `deinit`. For now, the `deinit` function isn't used, so you can leave it empty.

The `init` function is where you add commands.

```js
init() {
  this.addCommand('reallycool', this.coolFunction));
}

coolFuntion(input) {
  // Does the stuff
}
```

Adding a command allows 4 parameters

```js
this.addCommand(trigger, funct, permission, help);
// trigger    {string}                  word that triggers the command to run
// funct      {function, string}        function this command calls when being processed
// permission {integer}                 optional. permission level required for this command
// help       {string, Array, function} optional. more on this a bit further down
```

`funct` is given an `Input`, which reflects the user's input for this command. If `funct` is a string, it is treated the same as if it were specified by JSON. The function is automatically bound to the Addon, so `this` will refer to the addon.

secret_bot supports [Promises](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise). If `funct` returns a promise, it will wait for resolution before moving on to the next step.

As seen in the type declaration above, `help` can take on a few different types. If it is a string, it is returned as is. Arrays get their elements joined by a new line, allowing for multiline help to be specified easily. If the help is a function, the return value is used. The function is passed a `bot.Input` with no text value.

It's probably a lot easier to explain with examples. Go check out the `addons/` directory in this repository. `commands.js` has some basic command examples.
