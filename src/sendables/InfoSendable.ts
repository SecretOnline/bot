import BaseSendable from './BaseSendable';

/**
 * A sendable with a bit more information
 *
 * @export
 * @class InfoSendable
 */
export default class InfoSendable extends BaseSendable {
  title: string;
  description: string;
  url: string;
  thumbUrl: string;
  color: string;

  constructor(defaultText: string = '', isPrivate: boolean = false) {
    super(defaultText, isPrivate);
  }

  setTitle(title: string) {
    this.title = title;
    return this;
  }

  setDescription(description: string) {
    this.description = description;
    return this;
  }

  setUrl(url: string) {
    this.url = url;
    return this;
  }

  setThumbnail(thumbUrl: string) {
    this.thumbUrl = thumbUrl;
    return this;
  }

  setColor(color: string) {
    this.color = color;
    return this;
  }
}
