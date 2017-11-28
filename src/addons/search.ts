import Addon from '../common/Addon';
import Input from '../common/Input';
import Command from '../common/Command';
import InfoSendable from '../sendables/InfoSendable';
import AddonError from '../errors/AddonError';
import * as google from 'google';

import { truncate } from '../util';

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

  constructor(bot) {
    super(bot);
  }

  async start() {
    // tslint:disable max-line-length
    this.addCommand(new Command('google', this.google, this));
    // tslint:enable max-line-length

    return true;
  }

  async google(input: Input) {
    const response = await googlePromise(input.text);
    const links = response.links.slice(0, 5);

    const description = links
      .map(l => `**[${l.title}](${l.href})**\n${truncate(l.description, 140)}`)
      .join('\n\n');

    return new InfoSendable(`first result: ${links[0].href}`)
      .setAuthorName(response.query)
      .setAuthorUrl(response.url)
      // tslint:disable-next-line:max-line-length
      .setAuthorThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/512px-Google_%22G%22_Logo.svg.png')
      .setDescription(description);
  }
}
