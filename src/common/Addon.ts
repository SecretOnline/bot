import Thing from '../interfaces/Thing';

export interface AddonConfig {
  [x: string]: any,
}

export default abstract class Addon implements Thing {
  readonly name: string;
  readonly id: string;
  readonly version: string;
  readonly description: string;

  abstract start(config: AddonConfig): Promise<boolean>;
  abstract stop(): Promise<boolean>
}
