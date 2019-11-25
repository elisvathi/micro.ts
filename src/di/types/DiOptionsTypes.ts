export interface ServiceOptions {
    /**
     * If enabled it will return a new instance every time is required
     */
    transient?: boolean;
    scope?: string;
    ctorParams?: { type: any, injectOptions: InjectOptions }[];
}

export interface InjectOptions {
    key: any;
}
