# secret_bot

version 7.3.x

This page is for people who wish to use secret_bot in their own Discord servers. For more development related information, check out [README-dev.md](https://github.com/SecretOnline/bot/blob/master/README-dev.md).

* [Add the bot to your server](https://github.com/SecretOnline/bot#adding-secret_bot-to-your-server)
* [Basic usage for server admins](https://github.com/SecretOnline/bot#basic-setup-and-use)

## What is secret_bot?

secret_bot is a modular Discord chat bot written in [Node.js](https://nodejs.org/).

Commands start with the `~` character, but this can be changed per server (e.g. if there's another bot that uses `~`).

It features recursive command processing, so you can chain commands in one message (e.g. `~flip ~fliptable` will do `~fliptable` then flip it upside-down).

You can also add your own basic commands that will work in your server.

You can restrict secret_bot to certain channels, or let it be used everywhere.

## Adding secret_bot to your server

1. [Authorize the bot](https://discordapp.com/oauth2/authorize?client_id=177875535391752192&scope=bot&permissions=93184) to join your server. You require the Manage Server permission on your Discord server to be able to do this.
2. Start using the bot.

That's it, really! No need to do anything else.

## Basic setup and use

Clicked the link ([here it is again](https://discordapp.com/oauth2/authorize?client_id=177875535391752192&scope=bot&permissions=93184))? Added the bot? Great. First, let's look at some concepts.

### Command Groups

Every command in secret_bot belongs to a group. Each group is just a word that describes what the commands in that group do.

For example, the commands `~lenny` and `~disapprove` output `( ͡° ͜ʖ ͡°)` and `ಠ_ಠ` respectively, and are in the `faces` group. `~fliptable` flips a table, and is in the `flipping` group.

Each command group can be enabled and disabled, effectively adding or removing commands from your server. More on that after I explain the default groups.

#### Default Groups

The group `core` is always active on your server. It has important functions of the bot, so you could really mess things up if you removed it.

By default, the following groups are enabled. These can be disabled if you don't want them.

| Group | Description | Source |
| :------------- | :------------- | :--------- |
| emotes | A list of Unicode emotes that didn't make their way into `faces` | [emotes.json](https://github.com/SecretOnline/bot/blob/master/addons/emotes.json) |
| faces | A list of common Unicode emotes, and variations on each | [faces.json](https://github.com/SecretOnline/bot/blob/master/addons/faces.json) |
| flip | Turns text upside down | [flip.js](https://github.com/SecretOnline/bot/blob/master/addons/flip.js) |
| flipping | For all your table flipping needs | [flipping.json](https://github.com/SecretOnline/bot/blob/master/addons/flipping.json) |
| summaries | Gives information about pasted links | [summaries.js](https://github.com/SecretOnline/bot/blob/master/addons/summaries.js) |
| util | Currently unused. Will have commands like dice rolling and  | N/A |

### Some actual commands

#### `~help`

`~help` on its own will give you a small bit of information about the bot. Where `~help` is really useful is when you give it another command.

Almost every command in secret_bot has a help entry. Type `~help help` to get information about the `~help` command. `~help flip` will tell you what `~flip` does. It's worth checking out a command's `~help` page if you don't know what it does. You will often find example commands to help you understand what it does.

#### `~commands`, and related commands

`~commands` will send you a PM (private message) with a list of all commands you can run. The commands it lists depends on where you type it, since different servers can have different groups enabled.

If you put the name of a group after `~commands` (such as `~commands core`), then it will list all commands for that group.

To find out which group a command is in, use `~which` and put the name of the command after (e.g. `~which github`). Don't forget you can get help for each command with `~help`.

#### Enabling and Disabling command groups

Don't like the default command groups? That's OK. They're designed to give you an idea of what secret_bot can do, but still provide some useful things. Luckily for you, you don't have to use them forever.

To remove a command group from your server, use `~disable-addon` and put the group name at the end (e.g. `~disable-addon flipping` if you don't want table flipping).

Of course, there's a counterpart where you can add commands using `~enable-addon` for adding command groups. Remember to do `~help enable-addon` if you forget how it works.

This is how you add/remove commands that come with bot. You can add your own commands (for in-jokes and other things), which wil be explained in a later section.

#### Bot configuration

secret_bot uses the tilde `~` at the beginning of commands. If you want to change this, use `~change-prefix` then put the prefix you want to use. It doesn't have to be a single character, but it can't contain spaces. If you're feeling magical, you could do `~change-prefix abracadabra-`, which means to get help you'd type `abracadabra-help`.

Soon the colour of secret_bot's messages (well, the line to the left of them) will be able to be changed using `~change-color`. If you're trying to keep a colour theme with your bots, this will be useful for you.

#### Support

Need to actually talk to a human? secret_bot features a support line, where you can talk to an actual person if you encounter a big problem.

Please only use support when it's absolutely necessary. secret_bot is a hobby project, so the time I spend answering support questions is time I could be spending doing far more productive things.

To use the support, type `~support` and your reason (e.g. `~support No commands are working, and I don't know what to do!`). You will be sent a message with an invite link to join a support channel. To finish a support session, use `~support-close`.

### Adding your own commands

This section covers the basic usage available to server admins. For anything more complex, you'll have to [write some code](https://github.com/SecretOnline/bot#adding-an-addon).

The `~add-command` command (part of `core`) allows you to create a simple command for their server. There is also `~remove-command` which does what you'd expect.

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

There are some special things you can put into the `~add-command` command:

| Thing | What it does |
| :------------- | :------------- |
| {user} | Mentions the user who runs the created command (note: not the person who does `~add-command`) |
| {channel} | Mentions the channel the created command is run in |
| {server} | Says the name of the server |
| {args} | Says the text that is put after the final command |

```
secret_online: ~add-command example-command {args} <-- the text is there!
<- added ~example-command to server

secret_online: ~example-command hey, look
<- hey, look <-- the text is there!

secret_online: ~remove-command example-command
<- removed ~example-command from server

secret_online: ~add-command example-command {user} wrote {args} in {channel}
<- added ~example-command to server

secret_online: ~example-command a very long sentence that has very little meaning
<- @secret_online wrote a very long sentence that has very little meaning in #general

secret_online: ~remove-command example-command
<- removed ~example-command from server
```

## Version History (not really important)

I haven't ever had a good versioning system, so numbers are based on major events in the bot's lifetime.

* **7.x.x**  
  Only works on Discord, so it can use Discord features better  
  Better addon configuration  
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
