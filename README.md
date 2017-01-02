# secret_bot

version 7.3.x

* [Add the bot to your server](https://github.com/SecretOnline/bot#using-secret_bot)
* [Basic usage for server admins](https://github.com/SecretOnline/bot#basic-setup-and-use)
* [Adding commands](https://github.com/SecretOnline/bot#using-the-authorized-bot-link)
* [Adding commands (advanced)](https://github.com/SecretOnline/bot#adding-an-addon)

## What is secret_bot?

secret_bot is a modular Discord chat bot written in [Node.js](https://nodejs.org/).

It features recursive command processing, so you can chain commands in one message (e.g. `~flip ~fliptable`).

## Using secret_bot

If you want to use secret_bot on your Discord server, you can [authorize the bot](https://discordapp.com/oauth2/authorize?client_id=177875535391752192&scope=bot&permissions=93184) to join your server by clicking that link. You need to have the Manage Server permssion to be able to add it to a server. Once authorized, it should be available right away.

If you want to run your own version of the bot (or do some development), then you will need to clone this repository. For this, you'll need `git`, and since the bot runs on `node`, you'll need that as well.

```
$ git clone https://github.com/SecretOnline/bot.git
$ cd bot && npm install
```

You will need to configure the bot before it can run. I'll explain that in [a later section](https://github.com/SecretOnline/bot#using-the-cloned-development-bot).

## Why another rewrite?

Version 7 builds upon the ability for commands to access the rest of the bot, so a command can [call another command](https://github.com/SecretOnline/bot/commit/ae5281902341a43902b0158bc9f4f7c5fa27c497#diff-051ac24927ac63174d3fd41cdf2098eaR123). It also means they can do more than just return text, they can have [other side effects as well](https://github.com/SecretOnline/bot/commit/67c195c59aa970058f3f73dc009d893e3d998e53#diff-d62dce5120621199a95203fd01539030R212). Commands also have a group, which allows server admins to enable/disable groups of commands if they want/don't want them.

It also has a more formal help system, meaning it is easier to find out about a particular command.

The permissions system has been simplified. When an addon creates a command, it can specify one of three permission levels. **DEFAULT** is the default level, and means that this command can be run by anyone with typing permission. **ADMIN** refers to anyone with the Manage Server permission on the Discord server. **OVERLORD** means the owner of the bot, specified in the main bot configuration. Since permissions are done per-server, you might be able to run some commands on one server, but not on another.

Finally, secret_bot can be used on multiple Discord servers. Each server has its own configuration.

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

Version 7 changes script loading in a breaking way from v6. Old v6 modules will not load (but also won't crash the bot).

Script files must be valid Node.js modules, and should export a class that [extends `ScriptAddon`](https://github.com/SecretOnline/bot/blob/17c6ab52c1b64afe7485edc5e79ece79214deb79/addons/core.js#L3)

This differs from previous versions of secret_bot, where commands were directly specified in the module's exports.

```js
const ScriptAddon = require('../bot/ScriptAddon');
const Command = require('../bot/Command');
class YourCoolAddon extends ScriptAddon {
  // ...
}
module.exports = YourCoolAddon;
```

Each addon must have two functions: `init` and `deinit`. For now, the `deinit` function isn't used, so you can leave it empty.

The `init` function is where you add

```js
init() {
  this.bot.addCommand('reallycool', new Command(coolFunction, 'cool'));
}
```

The `Command` class is a more formal definition of a command than in previous iterations of secret_bot. The constructor takes up to 4 parameters, shown below.

```js
new Command(funct, group, bot.Command.PermissionLevels.DEFAULT, 'help');
// funct      {function, string}        function this command calls when being processed
// group      {string}                  name of the group this command belongs to
// permission {integer}                 optional. permission level required for this command
// help       {string, Array, function} optional. more on this a bit further down
```

`funct` is given an `Input`, which reflects the user's input for this command. If `funct` is a string, it is treated the same as if it were specified by JSON.

secret_bot supports [Promises](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise). If `funct` returns a promise, it will wait for resolution before moving on to the next step.

As seen in the type declaration above, `help` can take on a few different types. If it is a string, it is returned as is. Arrays get their elements joined by a new line, allowing for multiline help to be specified easily. If the help is a function, the return value is used. The function is passed a `bot.Input` with no text value.

It's probably a lot easier to explain with examples. Go check out the `addons/` directory in this repository. `commands.js` has some basic command examples.

## Configuration

### Using the authorized bot link

#### Basic setup and use

Clicked the link ([here it is again](https://discordapp.com/oauth2/authorize?client_id=177875535391752192&scope=bot&permissions=93184))? Added the bot? Great. Let's have a look at some commands.

The first command you should know is `~commands`. It sends you a DM (direct message) with a list of all the commands you can use on the server you typed the command in. You'll notice that the bot comes with some command groups enabled by default (core, default, emotes, faces, flipping). To have a look at what each command group adds, just add the name of the group to the command (`~commands core`). If you want to find out which group a particular command belongs to, you can use `~which` (`~which help`). For further help on a command, you can use `~help <command>. Some commands may not have any help associated with them.

The `core` addon has some reasonably important commands. I'd recommend against disabling it. To disable a command group, you can send `~disable-addon <addon name>`. Don't like table flipping? Easy: `~disable-addon flipping`. The counterpart of disable is `~enable-addon`, which works in the same way. Want to allow users to chose some roles on your server? `~enable-addon roles`. Every time you add a new addon, it may be useful to see the list of commands that it adds, and then view the `~help` for those commands.

If you have another bot that also uses the tilde (`~`) for commands and it's causing problems, you can use the `~change-char` command to change which character secret_bot uses for the beginning of commands.

#### Adding your own commands

This section covers the basic usage available to server admins. For anything more complex, you'll have to [write some code](https://github.com/SecretOnline/bot#adding-an-addon).

The `~add-command` command (part of `core`) allows server admins to create a simple command for their server. Examples of these are `~realbest`, `~islove`, and `~burn`. The most basic of these commands replace the commands with some text.

```
secret_online: ~add-command example-command this is an example command
<- added ~example-command to server
secret_online: ~example-command
<- this is an example command
secret_online: ~example-command that i wrote
<- this is an example command that i wrote
secret_online: ~remove-command example-command
<- removed ~example-command from server
secret_online: ~example-command
(nothing happens)
```

Slightly more advanced ones can use the text that comes *after* them in their output.

```
secret_online: ~add-command example-command {user} used this command
<- added ~example-command to server
secret_online: ~example-command
<- secret_online used this command
secret_online: ~remove-command example-command
<- removed ~example-command from server
secret_online: ~add-command example-command {user} wrote {args}
<- added ~example-command to server
secret_online: ~example-command a very long sentence that has very little meaning
<- secret_online wrote a very long sentence that has very little meaning
secret_online: ~remove-command example-command
<- removed ~example-command from server
```

### Using the cloned/development bot

You will still need to authorize the bot to join your server. However, you will need to set up a couple of files so the bot will actually run. Some parts are left over from previous iterations of the bot. I am working on cleaning it up.

#### main.conf.json

```js
{
  "paths": {
    "addons": "addons/",
    "connections": "connections/",
    "conf": "conf/"
  },
  "default": {
    "always": [
      "a list of command groups that can not be disabled"
    ]
  }
  "login": {
    "token": "your discord token"
  },
  "overlords": [
    "a list of user IDs that can run all commands all the time"
  ]
}
```

#### default.conf.json

```js
{
  "name": "", // not actually needed here, but some addons might end up using it
  "prefix": "~", // the character that servers will use at the beginning of commands by default
  "color": "#7289DA", // a colour for most Discord embeds
  "addons": [], // a list of command groups that are added to servers by default
  "addon-conf": {} // an empty object, just keep it here for safety
}

```

## Previous versions of secret_bot

I haven't ever had a good versioning system, so numbers are based on major events in the bot's lifetime.

* **6.x.x**  
  Moved to [bot](https://github.com/SecretOnline/bot)  
  Complete rewrite.  
  Allow multiple Discord servers  
  Abandon bot being module in favour of better Discord support  
* **5.x**  
  Bot is now a module  
  Uses IRCord as a bridge between IRC and Discord  
  Now supports Discord  
* **4.x**  
  Promises.  
  Big rewrite of internal logic to work with Promises  
* **3.x**  
  Moved to [secret_bot](https://github.com/SecretOnline/secret_bot)  
  Removed remote web server because of latency  
* **2.x**  
  Recursive command processing added!  
  Was kind-of buggy with async commands  
* **1**  
  Creation of [NMS-irc-bot](https://github.com/SecretOnline/NMS-irc-bot)  
