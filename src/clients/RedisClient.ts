import IoRedis, { Redis } from "ioredis";

export class RedisClient {
  public redis?: Redis;
  constructor(private config: {url: string} & {[key: string]: any}) {
  }

  public async init() {
		const {url,...options } = this.config;
    return new Promise<void>((resolve, reject) => {
      this.redis = new IoRedis(this.config.url, options);
      this.redis.on("connect", () => {
        console.log("Redis Connected on ", this.config.url);
        resolve();
      });
      this.redis.on("error", (err) => {
        reject(err);
      });
    });
  }

  public async get(key: string): Promise<string | null> {
    if(!this.redis){
      console.log("You forgot call init() method on the redis client!");
      return null;
    }
    return this.redis.get(key);
  }

  public async set(key: string, value: string, ex?: number): Promise<void> {
    if(!this.redis){
      console.log("You forgot call init() method on the redis client!");
      return;
    }
    if (!ex) {
      await this.redis.set(key, value);
    } else {
      await this.redis.set(key, value, "ex", ex);
    }
  }

  public async delete(key: string): Promise<void> {
    if(!this.redis){
      console.log("You forgot call init() method on the redis client!");
      return;
    }
    await this.redis.del(key);
  }

  public async getJson<T>(key: string): Promise<T | null> {
    const result = await this.get(key);
    if(!result){
      return null;
    }
    return JSON.parse(result) as T;
  }

  public async setJson<T>(key: string, value: T, ex?: number): Promise<void> {
    const str = JSON.stringify(value);
    await this.set(key, str, ex);
  }
}
