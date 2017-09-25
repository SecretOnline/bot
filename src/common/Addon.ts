import Thing from '../interfaces/Thing';

export interface AddonConfig {
  [x: string]: any,
}

export default abstract class Addon implements Thing {
  readonly abstract name: string;
  readonly abstract id: string;
  readonly abstract version: string;
  readonly abstract description: string;

  abstract start(config: AddonConfig): Promise<boolean>;
  abstract stop(): Promise<boolean>
}
