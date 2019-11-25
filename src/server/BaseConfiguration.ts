// import {Service} from "../di";
import config from "config";
import {IConfiguration} from "./IConfiguration";

// @Service()
export class BaseConfiguration implements IConfiguration {
  getFromPath<T>(path: string): T {
    return config.get<T>(path);
  }
}
