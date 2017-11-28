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
  authorName: string;
  authorUrl: string;
  authorThumb: string;

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

  setAuthorName(authorName: string) {
    this.authorName = authorName;
    return this;
  }

  setAuthorUrl(authorUrl: string) {
    this.authorUrl = authorUrl;
    return this;
  }

  setAuthorThumbnail(authorThumb: string) {
    this.authorThumb = authorThumb;
    return this;
  }
}
