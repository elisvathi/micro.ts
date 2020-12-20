export enum ServiceScope {
  Transient,
  Singleton,
  Request
}

export interface ServiceDecoratorOptions {
	scope?: ServiceScope;
}

export interface ServiceOptions extends ServiceDecoratorOptions {
  /**
   * If enabled it will return a new instance every time is required
   */
  ctorParams?: { type: any, injectOptions: InjectOptions }[];
}

export interface InjectOptions {
  key: any;
}
