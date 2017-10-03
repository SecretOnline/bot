import { format } from 'url';
import * as r2 from 'r2';

import Addon, { IAddonConfig } from '../common/Addon';
import Input from '../common/Input';
import Command from '../common/Command';
import TextSendable from '../sendables/TextSendable';
import SectionedSendable from '../sendables/SectionedSendable';
import AddonError from '../errors/AddonError';
import WrapperError from '../errors/WrapperError';

interface LocationConfig extends IAddonConfig {
  gapi: string;
}

export default class Location extends Addon {
  id = 'location';
  name = 'Location';
  description = 'Some location and time related commands';
  version = '9.0.0';

  private gapiKey: string;

  constructor(bot) {
    super(bot);
  }

  async start(conf: LocationConfig) {
    this.gapiKey = conf.gapi;

    // tslint:disable max-line-length
    this.addCommand(new Command('set-location', this.setLocation, this));
    this.addCommand(new Command('time', this.getTime, this));
    // tslint:enable max-line-length

    return true;
  }

  async setLocation(input: Input) {
    const url = format({
      pathname: 'https://maps.googleapis.com/maps/api/geocode/json',
      query: {
        key: this.gapiKey,
        address: input.text,
      },
    });

    let response;
    try {
      // tslint:disable-next-line max-line-length
      response = await r2(url).json;
      if (!(response.results && response.results.length)) {
        throw 'got response, but not long enough';
      }
    } catch (error) {
      throw new AddonError(this, 'unable to set your location at this time');
    }

    const addr = response.results[0].formatted_address;
    const latlng = response.results[0].geometry.location;

    const userConf = this.getConfig(input.user) || {};
    userConf.addr = addr;
    userConf.latlng = latlng;

    await this.setConfig(input.user, userConf);

    return new TextSendable('successfully set your location');
  }

  async getTime(input: Input) {
    const now = Math.floor(Date.now() / 1000); // Floor to nearest second

    const ids = input.args.length ? input.args : [input.user.id];

    const proms = ids
      .map((id) => {
        try {
          const user = this.bot.getUserFromId(id);
          const userConf = this.getConfig(user);

          const url = format({
            pathname: 'https://maps.googleapis.com/maps/api/timezone/json',
            query: {
              key: this.gapiKey,
              location: `${userConf.latlng.lat},${userConf.latlng.lng}`,
              timestamp: now,
            },
          }).replace('%2C', ',');

          console.log(url);

          return r2(url).json
            .then(r => ({ r, u: user }));
        } catch (error) {
          this.log(new WrapperError(error));
          return null;
        }
      })
      .filter(p => p);

    if (!proms.length) {
      throw new AddonError(this, 'no user IDs were found in the message');
    }

    let responses;
    try {
      responses = await Promise.all(proms);
    } catch (error) {
      throw new AddonError(this, 'unable to get times');
    }

    const infoArr = [];

    responses.forEach((res) => {
      if (res.r.status !== 'OK') {
        return;
      }

      const time = now + res.r.dstOffset + res.r.rawOffset;
      const date = new Date(time * 1000); // Turn back into ms

      const hrAbs = date.getUTCHours();
      const amPm = hrAbs >= 12;
      const hrs = (hrAbs % 12) || 12; // Turn 0 into 12
      const mins = date.getUTCMinutes();

      infoArr.push({
        user: res.u,
        str: `${hrs}:${mins} ${amPm ? 'PM' : 'AM'}`,
      });
    });

    const sendable = new SectionedSendable(
      infoArr.map(({ user, str }) => `${user.name}: ${str}`).join('\n'),
    );
    infoArr.forEach(({ user, str }) => {
      sendable.addSection(user.name, str, true);
    });

    return sendable;
  }
}
