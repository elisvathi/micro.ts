import typeorm, { ConnectionManager, ConnectionOptions, createConnection as createDatabaseConnection, Repository, useContainer, MongoRepository } from 'typeorm';
import { Container, getInjectParamTypes, getConstructorParams } from "../../di";
import { Class, OptionsBuilder } from "../../server";
import { ILogger, LoggerKey } from "../../server/Logger";

declare module "../../server/OptionsBuilder" {
  interface OptionsBuilder {
    useTypeOrm(config: typeorm.ConnectionOptions, name?: string): void;
    addModels(models: Class<any>[], name?: string): void;
  }
}

declare module "../../server/types/ServerOptions" {
  interface ServerOptions {
    typeormOptions?: { [key: string]: ConnectionOptions };
    models?: { [key: string]: Class<any>[] };
  }
}

OptionsBuilder.prototype.useTypeOrm = function(config: typeorm.ConnectionOptions, name: string = 'default') {
  useContainer(Container);
  this.options.typeormOptions = this.options.typeormOptions || {};
  this.options.typeormOptions[name] = config;
  this.addBeforeStartHook(async () => {
    let dbOptions: any = this.options.typeormOptions![name];
    this.options.models = this.options.models || {};
    dbOptions = { ...dbOptions, entities: this.options.models[name] || [] };
    await createDatabaseConnection({ ...dbOptions });
    Container.get<ILogger>(LoggerKey).info("Database connected");
  });
};

OptionsBuilder.prototype.addModels = function(models: Class<any>[], name: string = 'default') {
  if (!this.options.models) {
    this.options.models = {};
  }
  if (!this.options.models[name]){
    this.options.models[name] = [];
  }
    this.options.models[name].push(...models);
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

export function InjectManager(name: string = 'default', transient: boolean = false) {
  const key = {
    type: '__typeorm_entity_manager',
    connectionname: name,
    transient
  }
  return (target: any, _propertyKey: string, parameterIndex: number) => {
    let ctorMetadata = getInjectParamTypes(target);
    if (!ctorMetadata) {
      const constructorArgs = getConstructorParams(target);
      ctorMetadata = constructorArgs.map((x: any) => {
        return { type: x };
      });
    }
    if (!Container.hasResolver(key)) {
      Container.bindResolver(key, () => {
        try {
          const connectionManager = Container.get<ConnectionManager>(ConnectionManager);
          const connection = connectionManager.get(name);
          if (transient) {
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
    let ctorMetadata = getInjectParamTypes(target);
    if (!ctorMetadata) {
      let constructorArgs = getConstructorParams(target);
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
          if(paramType === MongoRepository && model){
            return connection.getMongoRepository<T>(model);
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
