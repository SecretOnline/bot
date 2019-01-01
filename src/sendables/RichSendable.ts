import BaseSendable from './BaseSendable';

interface ISection {
  title: string;
  text: string;
  inline: boolean;
}

/**
 * A sendable with a bit more information
 *
 * @export
 * @class RichSendable
 */
export default class RichSendable extends BaseSendable {
  title: string;
  description: string;
  url: string;
  thumbUrl: string;
  color: string;
  authorName: string;
  authorUrl: string;
  authorThumb: string;
  sections: ISection[] = [];

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

  addSection(title: string, text: string, inline = false) {
    this.sections.push({
      title,
      text,
      inline,
    });
    return this;
  }
}
