export interface ServiceOptions {
    transient?: boolean;
    scope?: string;
    ctorParams?: { type: any, injectOptions: InjectOptions }[];
}

export interface InjectOptions {
    key: any;
}
