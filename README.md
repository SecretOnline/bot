# secret_bot

version 6.x.x

TODO: some nice hyperlinks to go to areas of this readme

## What is secret_bot?

secret_bot is a modular Discord chat bot written in [Node.js](https://nodejs.org/).

It features recursive command processing, so you can chain commands in one message (e.g. `~flip ~fliptable`).

## Using secret_bot

If you want to use secret_bot on your Discord server, you can [authorize the bot](https://discordapp.com/oauth2/authorize?client_id=177875535391752192&scope=bot) to join your server by clicking that link. You need to have the Manage Server permssion to be able to add it to a server. Once authorized, it should be available right away.

If you want to run your own version of the bot (or do some development), then you will need to clone this repository. For this, you'll need `git`, and since the bot runs on `node`, you'll need that as well.

```
$ git clone https://github.com/SecretOnline/bot.git
$ cd bot && npm install
```

You will need to configure the bot before it can run. I'll explain that in a later section.

## Why another rewrite?

Version 6 adds the ability for commands to access the rest of the bot, so a command can theoretically call another command. It also means they can do more than just return text, they can have other side effects as well. Commands also have a group, which allows server admins to enable/disable groups of commands if they want/don't want them.

With that, this version also brings the return of custom commands, known in versions 3/4 as the alias system. This provides an easy way for server admins to add their own basic call/response commands.

It also has a more formal help system, meaning it is easier to find out about a particular command.

The permissions system has been simplified. When an addon creates a command, it can specify one of three permission levels. **DEFAULT** is the default level, and means that this command can be run by anyone with typing permission. **ADMIN** refers to anyone with the Manage Server permission on the Discord server. **OVERLORD** means the owner of the bot, specified in the main bot configuration. Since permissions are done per-server, you might be able to run some commands on one server, but not on another.

Finally, secret_bot can be used on multiple Discord servers. While it *could* in previous versions, it could have led to some strange behaviours. Servers can enable and disable groups of commands per server.

## Adding an addon

The basic command system not enough for you? Need something a little more? You're in luck, because adding an addon is pretty simple.

Addons come in two forms: JSON and JS.

### JSON

Any JSON files in the `./addons/` directory will get loaded by the bot.

```json
{
  "trigger": "response"
}
```

The `trigger` is the name of the command. It is called by typing `~trigger` in the chat, and will give the reponse back. If the response contains `{args}`, that will be replaced by the text that follows the command in the original message. Likewise, `{user}` will be replaced by the user's name.

```
secret_online: ~realbest responses
<- the real responses, the best responses
secret_online: ~vote GROW
<- secret_online voted to GROW
```

Commands loaded by JSON are added to a command group with the same name as the file. e.g. commands in `cool.json` will be in the `cool` group.

### JS

Any javascript files in the `./addons/` directory will also be loaded.

Script files must be valid Node.js modules, and should export an `init` function, and optionally a `deinit` function. The `init` is called when the module is loaded, and `deinit` when the bot is being reloaded (note: may not happen on shutdown).

This differs from previous versions of secret_bot, where commands were directly specified in the module's exports.

```js
module.exports = {
  init: yourInitFunction,
  deinit: yourDeinitFunction
}
```

The `init` function is passed an instance of a Bot, which you can use to register commands.

```js
function init(bot) {
  bot.registerCommand('reallycool', new bot.Command(coolFunction, 'cool'));
}
```

The `bot.Command` class is a more formal definition of a command than in previous iterations of secret_bot. The constructor takes up to 4 parameters, shown below.

```js
new bot.Command(funct, group, bot.Command.PermissionLevels.DEFAULT, 'help');
// funct      {function, string}        function this command calls when being processed
// group      {string}                  name of the group this command belongs to
// permission {integer}                 optional. permission level required for this command
// help       {string, Array, function} optional. more on this a bit further down
```

`funct` is given a `bot.Input`, which reflects the user's input for this command. If `funct` is a string, it is treated the same as if it were specified by JSON.

secret_bot supports [Promises](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise). If `funct` returns a promise, it will wait for resolution before moving on to the next step.

As seen in the type declaration above, `help` can take on a few different types. If it is a string, it is returned as is. Arrays get their elements joined by a new line, allowing for multiline help to be specified easily. If the help is a function, the return value is used. The function is passed a `bot.Input` with no text value.

It's probably a lot easier to explain with examples. Go check out the `addons/` directory in this repository. `commands.js` has some basic command examples.

## Configuration

### Using the authorized bot link

Clicked the link ([here it is again](https://discordapp.com/oauth2/authorize?client_id=177875535391752192&scope=bot))? Added the bot? Great. Let's have a look at some commands.

The first command you should know is `~commands`. It sends you a DM (direct message) with a list of all the commands you can use on the server you typed the command in. You'll notice that the bot comes with some command groups enabled by default (core, default, emotes, faces, flipping). To have a look at what each command group adds, just add the name of the group to the command (`~commands core`). If you want to find out which group a particular command belongs to, you can use `~which` (`~which help`). For further help on a command, you can use `~help <command>. Some commands may not have any help associated with them.

The `core` addon has some reasonably important commands. I'd recommend against disabling it. To disable a command group, you can send `~disable-addon <addon name>`. Don't like table flipping? Easy: `~disable-addon flipping`. The counterpart of disable is `~enable-addon`, which works in the same way. Want to allow users to chose some roles on your server? `~enable-addon roles`. Every time you add a new addon, it may be useful to see the list of commands that it adds, and then view the `~help` for those commands.

### Using the cloned/development bot

You will still need to authorize the bot to join your server. However, you will need to set up a couple of files so the bot will actually run.

#### main.conf.json

```js
{
  "token": "<bot's discord token>", // used for login
  "reconnect": true, // boolean, whether the bot should try to reconnect if its connection drops
  "verbose": true, // more verbose logging
  "files": {
    "servers": "servers.conf.json", // file to store per-server configuration
    "addons": "./addons/" // addons directory, NYI
  },
  "overlords": [ // a list of user ids who have access to ALL enabled commands
    "<user id>"
  ]
}
```

#### servers.conf.json

```js
{
  "_default": {
    "char": "~", // default command character
    "groups": [ // a list of command groups that are enabled by default
      "core", // commands that affect how bot runs in your server
      "default", // some basic commands for people to use
      "emotes", // some basic emotes, mostly those that aren't in faces
      "faces", // ~lenny
      "flipping" // for all your table flipping needs
    ]
  }
}
```
