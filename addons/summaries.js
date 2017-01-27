// This addon only works for Discord at the moment
const Discord = require('discord.js');
const snoowrap = require('snoowrap');
const github = require('github');
const google = require('google');

const ScriptAddon = require('../bot/ScriptAddon.js');

const truncate = require('../util').truncate;

google.resultsPerPage = 8;

let githubRegex = /(?:https?:\/\/github.com\/)?([\w-]+)\/([\w-]+)/;

let redditHelp = [
  'Gets info about a reddit thread or comment'
];
let githubHelp = [
  'Gets info about a Github repository'
];
let googleHelp = [
  'Gets the first 5 results of a Google search'
];

class Summaries extends ScriptAddon {
  constructor(bot) {
    super(bot, 'summaries');

    this.conf = this.getConfig('default');

    this.snoo = new snoowrap({
      userAgent: 'nodejs:secret_bot:7.x.x (by /u/secret_online)',
      clientId: this.conf.reddit.id,
      clientSecret: this.conf.reddit.secret,
      refreshToken: this.conf.reddit.refresh,
      accessToken: this.conf.reddit.access
    });

    this.github = new github({
      headers: {
        'user-agent': 'secret_bot/7.x.x - by @secret_online'
      }
    });
  }

  init() {
    this.addCommand('reddit', this.redditSummary, redditHelp);
    this.addCommand('github', this.githubSummary, githubHelp);
    this.addCommand('google', this.googleSummary, googleHelp);
  }
  
  redditSummary(input) {
    return new Promise((resolve, reject) => {
      let exps = [
        [/redd\.it\/([a-z0-9]+)$/, 'post'],
        [/(?:reddit\.com)?\/?r\/(\w+)\/?$/, 'subreddit'],
        [/(?:reddit\.com)?\/?u\/(\w+)\/?$/, 'user'],
        [/(?:reddit\.com)?\/?r\/\w+\/comments\/([a-z0-9]+)\/\w+\/?$/, 'post'],
        [/(?:reddit\.com)?\/?r\/\w+\/comments\/([a-z0-9]+)\/\w+\/([a-z0-9]+)\/?$/, 'comment'],
      ];
      let p = exps.find((pair) => {
        return input.text.match(pair[0]);
      });

      let prom;
      let match = input.text.match(p[0]);
      switch (p[1]) {
        case 'post':
          prom = this._redditGetPostInfo(match[1]);
          break;
        case 'comment':
          prom = this._redditGetCommentInfo(match[1], match[2]);
          break;
        case 'user':
          prom = this._redditGetUserInfo(match[1]);
          break;
        case 'subreddit':
          prom = this._redditGetSubInfo(match[1]);
          break;
        default:
          throw 'link was not valid';
      }

      prom
        .then((embed) => {
          this.bot.send(input.message.channel, embed);
          resolve('');
        }, reject);
    });
  }

  _redditGetPostInfo(id) {
    return this.snoo.getSubmission(id)
      .fetch()
      .then((post) => {
        let embed = new Discord.RichEmbed()
          .setTitle(`${post.title} - /r/${post.subreddit.display_name}`)
          .setAuthor(`/u/${post.author.name}`)
          .setURL(post.url)
          .addField('Score',`**${post.score}** points\n${post.ups} upvotes`, true)
          .addField(`[${post.num_comments} comments](https://reddit.com${post.permalink})`, '\u200b', true);

        if (post.is_self) {
          embed.setDescription(truncate(post.selftext));
        } else {
          if (post.thumbnail) {
            embed.setThumbnail(post.thumbnail);
          }
        }

        return embed;
      });
  }

  _redditGetCommentInfo(postId, commentId) {
    let postProm = this.snoo.getSubmission(postId).fetch();
    let commProm = this.snoo.getComment(commentId).fetch();
    return Promise.all([
      postProm,
      commProm
    ])
      .then(([post, comment]) => {
        let embed = new Discord.RichEmbed()
          .setTitle(`Comment on ${post.title} - /r/${post.subreddit.display_name}`)
          .setDescription(truncate(comment.body))
          .setAuthor(`/u/${comment.author.name}`)
          .setURL(`https://reddit.com${post.permalink}${comment.id}`)
          .addField('Comment Score',`**${comment.score}** points\n${comment.ups} upvotes`, true);

        return embed;
      });
  }

  _redditGetUserInfo(name) {
    return this.snoo.getUser(name)
      .fetch()
      .then((user) => {
        let embed = new Discord.RichEmbed()
          .setTitle(`/u/${user.name}`)
          .setURL(`https://reddit.com/u/${user.name}`)
          .addField('Karma',`**${user.link_karma}** link karma\n${user.comment_karma} comment karma`, true);

        return embed;
      });
  }

  _redditGetSubInfo(name) {
    return this.snoo.getSubreddit(name)
      .fetch()
      .then((sub) => {
        let embed = new Discord.RichEmbed()
          .setTitle(`/r/${sub.display_name} - ${sub.title}`)
          .setDescription(truncate(sub.description))
          .setURL(`https://reddit.com${sub.url}`)
          .addField('Users',`**${sub.subscribers}** subs\n${sub.accounts_active} there now`, true);

        if (sub.header_img) {
          embed.setThumbnail(sub.header_img);
        }

        return embed;
      });
  }

  githubSummary(input) {
    return input.process()
      .then((result) => {
        return new Promise((resolve, reject) => {
          let match = result.match(githubRegex);
          if (!match) {
            reject(`${result} isn't a github url`);
            return;
          }

          let owner = match[1];
          let repo = match[2];

          this.github.repos.get({owner, repo}, (err, res) => {
            if (err) {
              reject('error while trying to get repository details');
              this.error(err);
              return;
            }

            let embed = new Discord.RichEmbed()
              .setTitle(res.name)
              .setDescription(res.description)
              .setAuthor(res.owner.login, res.owner.avatar_url)
              .setURL(res.html_url);

            if (res.fork) {
              embed.addField('Fork of:', `[${res.source.fullName}](${res.source.html_url})`);
            }

            embed
              .addField('Stats',`**${res.forks_count}** forks\n**${res.stargazers_count}** stars\n**${res.watchers_count}** watching`, true)
              .addField('\u200b', `Created: ${new Date(res.created_at).toDateString()}\nUpdated: ${new Date(res.pushed_at).toDateString()}\n**${res.open_issues_count}** [issues or PRs](${res.html_url}/issues)`, true);

            this.bot.send(input.message.channel, embed);

            resolve('');
          });
        });
      });
  }

  googleSummary(input) {
    return input.process()
      .then((res) => {
        return new Promise((resolve, reject) => {
          google(res, (err, result) => {
            if (err) {
              reject('google search failed');
              return;
            }

            let embed = new Discord.RichEmbed()
              .setAuthor(res, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/512px-Google_%22G%22_Logo.svg.png');

            result.links
              .filter(item => item.title && item.href)
              .splice(0, 5)
              .forEach((item) => {
                embed.addField(item.title, `${item.href}\n ${truncate(item.description)}`);
              });

            this.bot.send(input.message.channel, embed);
          });
        });
      });
  }
}

module.exports = Summaries;
