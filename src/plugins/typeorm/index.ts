import typeorm, { ConnectionManager, ConnectionOptions, createConnection as createDatabaseConnection, Repository, useContainer } from 'typeorm';
import { Container } from "../../di";
import { Class, OptionsBuilder } from "../../server";
import { ILogger, LoggerKey } from "../../server/Logger";

declare module "../../server/OptionsBuilder" {
  interface OptionsBuilder {
    useTypeOrm(config: typeorm.ConnectionOptions): void;
    addModels(...models: Class<any>[]): void;
  }
}

declare module "../../server/types/ServerOptions" {
  interface ServerOptions {
    typeormOptions?: ConnectionOptions;
    models?: Class<any>[];
  }
}

OptionsBuilder.prototype.useTypeOrm = function(config: typeorm.ConnectionOptions) {
  useContainer(Container);
  this.options.typeormOptions = config;
  this.addBeforeStartHook(async () => {
    let dbOptions: any = this.options.typeormOptions;
    dbOptions = { ...dbOptions, entities: this.options.models || [] };
    await createDatabaseConnection({ ...dbOptions });
    Container.get<ILogger>(LoggerKey).info("Database connected");
  });
};

OptionsBuilder.prototype.addModels = function(...models: Class<any>[]) {
  if (!this.options.models) {
    this.options.models = [];
  }
  this.options.models.push(...models);
};

export function InjectConnection(name: string = 'default') {
  const key = {
    type: '__typeorm_connection',
    connectionName: name
  }
  return (target: any, _propertyKey: string, parameterIndex: number) => {
    let ctorMetadata = Reflect.getOwnMetadata('design:injectparamtypes', target);
    if (!ctorMetadata) {
      const constructorArgs = Reflect.getOwnMetadata('design:paramtypes', target) || [];
      ctorMetadata = constructorArgs.map((x: any) => {
        return { type: x };
      });
    }
    if (!Container.hasResolver(key)) {
      Container.bindResolver(key, () => {
        try {
          const connectionManager = Container.get<ConnectionManager>(ConnectionManager);
          const connection = connectionManager.get(name);
          return connection;
        } catch (err) {
          console.log("ERROR GETTING CONNECTION", err);
        }
      });
    }
    ctorMetadata[parameterIndex].injectOptions = { key: key || ctorMetadata[parameterIndex].type };
    Reflect.defineMetadata('design:injectparamtypes', ctorMetadata, target);
  }
}

export function InjectManager(name: string = 'default', transient: boolean = false){
  const key = {
    type: '__typeorm_entity_manager',
    connectionname: name,
    transient
  }
  return (target: any, _propertyKey: string, parameterIndex: number) => {
    let ctorMetadata = Reflect.getOwnMetadata('design:injectparamtypes', target);
    if (!ctorMetadata) {
      const constructorArgs = Reflect.getOwnMetadata('design:paramtypes', target) || [];
      ctorMetadata = constructorArgs.map((x: any) => {
        return { type: x };
      });
    }
    if (!Container.hasResolver(key)) {
      Container.bindResolver(key, () => {
        try {
          const connectionManager = Container.get<ConnectionManager>(ConnectionManager);
          const connection = connectionManager.get(name);
          if(transient){
            return connection.createEntityManager();
          }
          return connection.manager;
        } catch (err) {
          console.log("ERROR GETTING CONNECTION", err);
        }
      });
    }
    ctorMetadata[parameterIndex].injectOptions = { key: key || ctorMetadata[parameterIndex].type };
    Reflect.defineMetadata('design:injectparamtypes', ctorMetadata, target);
  }
}

export function InjectRepository<T = any>(model?: Class<T>, name: string = 'default') {
  const key = {
    type: '__repository',
    model,
    connectionName: name
  };
  return (target: any, _propertyKey: string, parameterIndex: number) => {
    let ctorMetadata = Reflect.getOwnMetadata('design:injectparamtypes', target);
    if (!ctorMetadata) {
      const constructorArgs = Reflect.getOwnMetadata('design:paramtypes', target) || [];
      ctorMetadata = constructorArgs.map((x: any) => {
        return { type: x };
      });
    }
    const paramType = ctorMetadata[parameterIndex].type;
    if (!Container.hasResolver(key)) {
      Container.bindResolver(key, () => {
        try {
          const connectionManager = Container.get<ConnectionManager>(ConnectionManager);
          const connection = connectionManager.get(name);
          if (paramType === Repository && model) {
            return connection.getRepository<T>(model);
          }
          else return connection.getCustomRepository<T>(paramType);
        } catch (err) {
          console.log("ERROR GETTING REPOSITORY", err);
        }
      });
    }
    ctorMetadata[parameterIndex].injectOptions = { key: key || ctorMetadata[parameterIndex].type };
    Reflect.defineMetadata('design:injectparamtypes', ctorMetadata, target);
  }
}
