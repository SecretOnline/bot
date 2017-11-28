import Addon from '../common/Addon';
import Input from '../common/Input';
import Command from '../common/Command';
import InfoSendable from '../sendables/InfoSendable';
import TextSendable from '../sendables/TextSendable';
import AddonError from '../errors/AddonError';
import * as google from 'google';
import * as YouTube from 'youtube-node';
import wikijs, { Page, Result } from 'wikijs';

import { truncate } from '../util';
import { resolve } from 'dns';

google.resultsPerPage = 8;

// tslint:disable max-line-length
// TODO: Help
// tslint:enable max-line-length

interface GoogleResponse {
  url: string;
  query: string;
  links: GoogleLink[];
  body: string;
  $: any;
}

interface GoogleLink {
  title: string;
  description: string;
  href: string;
}

interface YouTubeResponse {
  items: YouTubeLink[];
}

interface YouTubeLink {
  id: {
    videoId: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    channelTitle: string;
    title: string;
    description: string;
    thumbnails: {
      default: {
        url: string,
      },
      medium: {
        url: string,
      },
      high: {
        url: string,
      },
    };
  };
}

async function googlePromise(search: string) {
  return new Promise<GoogleResponse>((resolve, reject) => {
    google(search, (err?: Error, res?: GoogleResponse) => {
      if (err) {
        reject(err);
      }

      resolve(res);
    });
  });
}

export default class Search extends Addon {
  name = 'Search';
  id = 'search';
  description = 'Allows you to harness the infinite power of the internet';
  version: '9.0.0';

  private youtubeApi: any;

  constructor(bot) {
    super(bot);

    this.youtubeApi = new YouTube();
  }

  async start(conf) {
    this.youtubeApi.setKey(conf.gapi);

    // tslint:disable max-line-length
    this.addCommand(new Command('google', this.google, this));
    this.addCommand(new Command('youtube', this.youTube, this));
    // tslint:enable max-line-length

    return true;
  }

  async google(input: Input) {
    const response = await googlePromise(input.text);
    const links = response.links.slice(0, 5);

    const description = links
      .map(l => `**[${l.title}](${l.href})**\n${truncate(l.description, 140)}`)
      .join('\n\n');

    return new InfoSendable(links[0].href)
      .setAuthorName(response.query)
      .setAuthorUrl(response.url)
      // tslint:disable-next-line:max-line-length
      .setAuthorThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/512px-Google_%22G%22_Logo.svg.png')
      .setDescription(description);
  }

  async youTube(input: Input) {
    const response = await new Promise<YouTubeResponse>((resolve, reject) => {
      this.youtubeApi.search(input.text, 1, (err, res: YouTubeResponse) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(res);
      });
    });

    const item = response.items[0];
    return new TextSendable(`https://youtube.com/watch?v=${item.id.videoId}`);
  }
}
