import { ServiceOptions } from "./types/DiOptionsTypes";
/**
 * Provide custom configuration (transient, or scoped)  for a service to register it in the DI container
 * @param options
 */
export declare function Service(options?: ServiceOptions): (target: any) => void;
/**
 * Decorator is used in constructor arguments, for services of app controllers
 * @param key
 */
export declare function Inject(key?: any): (target: any, _propertyKey: string, parameterIndex: number) => void;
