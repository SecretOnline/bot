declare module 'r2' {
  export default class R2 {
    public text: Promise<string>;
    public json: Promise<any>;
    public arrayBuffer: Promise<ArrayBuffer>;
    public blob: Promise<Blob>;
    public formData: Promise<FormData>;

    constructor(url: string);
    constructor(args: object);
    constructor(url: string, args: object);

    setHeaders(obj: object): R2;
    setHeader(key: string, value: string): R2;
  }

  export function get(url: string): R2;
  export function get(args: object): R2;
  export function get(url: string, args: object): R2;

  export function put(url: string): R2;
  export function put(args: object): R2;
  export function put(url: string, args: object): R2;

  export function post(url: string): R2;
  export function post(args: object): R2;
  export function post(url: string, args: object): R2;

  export function head(url: string): R2;
  export function head(args: object): R2;
  export function head(url: string, args: object): R2;

  export function patch(url: string): R2;
  export function patch(args: object): R2;
  export function patch(url: string, args: object): R2;
}
