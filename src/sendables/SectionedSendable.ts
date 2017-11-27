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
 * @class SectionedSendable
 */
export default class SectionedSendable extends BaseSendable {
  title: string;
  description: string;
  color: string;
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

  setColor(color: string) {
    this.color = color;
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
