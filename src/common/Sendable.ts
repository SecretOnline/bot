export default class Sendable {
  protected text: string;
  protected title: string;
  protected image: string;
  protected thumbnail: string;
  protected color: string;

  constructor() {}

  setText(str: string): Sendable {
    this.text = str;
    return this;
  }

  setTitle(str: string): Sendable {
    this.title = str;
    return this;
  }

  setImage(str: string): Sendable {
    this.image = str;
    return this;
  }

  setThumbnail(str: string): Sendable {
    this.thumbnail = str;
    return this;
  }

  setColor(str: string): Sendable {
    this.color = str;
    return this;
  }
}
