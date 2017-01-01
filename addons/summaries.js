// This addon only works for Discord at the moment
const Discord = require('discord.js');
const snoowrap = require('snoowrap');

const ScriptAddon = require('../bot/ScriptAddon.js');
const Command = require('../bot/Command.js');

const truncate = require('../util').truncate;

// This is a monstrosity
// Matches:
//   redd.it/<id>
//   reddit.com/r/<id>[/comments/<id>]
//   <subreddit>.reddit.com/<id>
let redditRegex = /https?:\/\/(?:(?:redd\.it\/(\w+))|(?:\w+\.)reddit\.com\/r\/\w+\/comments\/(\w+)(\/[^\s/]+\/\w+)?|(\w+\.)reddit\.com\/(\w+)\/)/;

let redditHelp = [
  'Gets info about a reddit thread or comment'
];

class Summaries extends ScriptAddon {
  constructor(bot) {
    super(bot, 'summaries');

    this.snoo = new snoowrap({
      userAgent: this.conf.reddit.useragent,
      clientId: this.conf.reddit.id,
      clientSecret: this.conf.reddit.secret,
      refreshToken: this.conf.reddit.refresh,
      accessToken: this.conf.reddit.access
    });
  }

  init() {
    this.bot.addCommand('reddit-summary', new Command(this.redditSummary.bind(this), 'summaries', redditHelp));
  }

  deinit() {
    // Do nothing
  }

  redditSummary(input) {
    return new Promise((resolve, reject) => {
      let match = input.text.match(redditRegex);
      if (!match) {
        reject(`${input.text} isn't a reddit url`);
        return;
      }

      let postId, commentId, post, comment;
      // Short URL
      if (match[1]) {
        postId = match[1];
      } else
      // Normal URL
      if (match[2]) {
        postId = match[2];
        commentId = match[3];
      } else
      // subreddit subdomain
      if (match[4]) {
        postId = match[5];
      } else {
        reject('expression error trying to get reddit summary');
        return;
      }

      post = this.snoo.getSubmission(postId);
      if (commentId) {
        comment = this.snoo.getComment(commentId);
      }

      let promises = [
        post.fetch(),
        post.author.fetch()
      ];

      Promise.all(promises)
        .then((res) => {
          let post = res[0];
          let author = res[1];
          let embed = new Discord.RichEmbed()
            .setTitle(post.title)
            .setAuthor(`${author.name} - /r/${post.subreddit.display_name}`)
            .setURL(post.url)
            .addField('Score',`**${post.score}** points\n${post.ups} upvotes`, true)
            .addField(`${post.num_comments} comments`, '\u200b', true);

          if (post.is_self) {
            embed.setDescription(truncate(post.selftext));
          } else {
            if (post.thumbnail) {
              embed.setThumbnail(post.thumbnail);
            }
          }

          this.bot.send(input.message.channel, embed);

          resolve('');
        }, (err) => {
          reject('unable to get reddit summary');
        });
    });
  }
}

module.exports = Summaries;
