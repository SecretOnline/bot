import Thing from './Thing';

export interface ConnectionConfig {
  [x: string]: any,
}

interface ConnectionStartFunction {
  (config: ConnectionConfig): boolean,
}

interface ConnectionStopFunction {
  (): boolean,
}

export default interface Connection extends Thing {
  start: ConnectionStartFunction
  stop: ConnectionStopFunction
}
