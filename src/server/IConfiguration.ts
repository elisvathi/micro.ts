import config from 'config';
import {Service} from "../di";
export interface IConfiguration {
  getFromPath<T>(path: string): T;
}

@Service()
export class BaseConfiguration implements IConfiguration{
  getFromPath<T>(path: string): T {
    return config.get<T>(path);
  }
}
