import Thing from './Thing';

export interface AddonConfig {
  [x: string]: any,
}

interface AddonStartFunction {
  (config: AddonConfig): boolean,
}

interface AddonStopFunction {
  (): boolean,
}

export default interface Addon extends Thing {
  version: string,
  description: string,
  start: AddonStartFunction
  stop: AddonStopFunction
}
