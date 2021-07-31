import joiSwagger from 'joi-to-swagger';
import { getSchema } from 'joi-typescript-validator';
import { OpenAPIV3 } from 'openapi-types';
import { GlobalMetadata, ControllerMetadata, MethodDescription, ParamDecoratorType } from '../decorators';
import { getGlobalMetadata } from '../decorators/GlobalMetadata';
import { Class, BaseRouteDefinition } from '../server/types';

export function getServerInfo(title: string, version: string, description: string): OpenAPIV3.InfoObject {
  return { title, version, description };
}

export function getServerObject(host: string, port: number, protocol: string = 'http', description: string = ""): OpenAPIV3.ServerObject {
  return {
    url: "{protocol}://{host}:{port}",
    description,
    variables: { host: { default: host }, port: { default: port.toString() }, protocol: { default: protocol } }
  }
}

export const schemas: Map<Class<any>, any> = new Map<Class<any>, any>();

const controllers: GlobalMetadata = getGlobalMetadata();

interface Api {
	[key: string]: ReturnType<typeof buildMethodParameters> | any;
}

type Schema = Api & {
	path?: string;
}

function buildControllerSchema(metadata: ControllerMetadata) {
  const methodSchemas: { [key: string]: any } = {};
  if (metadata.handlers) {
    Object.keys(metadata.handlers).forEach(key => {
      const obj = buildHandlerSchema('', metadata.options?.path || "", metadata.ctor, metadata.handlers![key]);
      methodSchemas[obj.path] = methodSchemas[obj.path] || {};
      const newObj = { ...obj } as Schema;
      delete newObj.path;
      Object.assign(methodSchemas[obj.path], newObj);
    });
  }
  return methodSchemas;
}

function extractPath(def: BaseRouteDefinition) {
  let basePart: string = def.base;
  if (basePart && basePart.indexOf("/") !== 0) {
    basePart = `/${basePart}`;
  }
  let controllerPart = def.controller;
  if (controllerPart.indexOf("/") !== 0) {
    controllerPart = `/${controllerPart}`;
  }
  let handlerPart = def.handler;
  const params = extractParamNames(handlerPart);
  handlerPart = params.map(x => {
    if (x.param) {
      return `{${x.name}}`
    }
    return x.name;
  }).join('/');
  if (handlerPart.indexOf("/") !== 0 && handlerPart.length > 0) {
    handlerPart = `/${handlerPart}`;
  }
  return `${basePart}${controllerPart}${handlerPart}`.replace(/\/\//g, "/");
}

function extractParamNames(path: string, separator = "/") {
  const spl = path.split(separator);
  return spl.map(x => {
    const value: { name: string, param: boolean } = { name: x, param: false };
    if (x.length > 0 && x[0] === ":") {
      value.name = x.substr(1);
      value.param = true;
    }
    return value;
  });
}

function buildHandlerSchema(basePath: string, controllerPath: string, ctor: any, description: MethodDescription) {
  const routeDefinition: BaseRouteDefinition = {
    base: basePath,
    controller: controllerPath,
    controllerCtor: ctor,
    handler: description.metadata?.path || "",
    handlerName: description.name || "",
    method: description.metadata?.method || 'get',
    queueOptions: description.metadata!.queueOptions,
    json: true,
    timeout: 0
  };
  return {
    path: extractPath(routeDefinition),
    [description.metadata?.method || 'get']: buildMethodParameters(description, ctor.name)
  }
}

function buildMethodParameters(method: MethodDescription, controller: string) {
  const obj: OpenAPIV3.OperationObject = { responses: { '200': { description: "" } } }
  obj.tags = [controller];
  method.params.forEach(param => {
    if (param.options?.decoratorType) {

      // BODY
      if (param.options.decoratorType === ParamDecoratorType.Body) {
        obj.requestBody = {
          content:
          {
            'application/json':
              { schema: getObjectSchema(param.type) }
          },
          required: !!param.options.bodyOptions?.required,
        }
      }
      // BODY FIELD

      // PATH PARAM
      if (param.options.decoratorType === ParamDecoratorType.ParamField) {
        obj.parameters = obj.parameters || [];
        const name = param.options.name;
        if (!obj.parameters.find((x: any) => x.name === name && x.id === 'path')) {
          obj.parameters.push({
            name,
            in: 'path',
            required: true,
            schema: {
              type: param.type.name.toLowerCase()
            }
          });
        }
      }
      // FULL PARAMS OBJECT

      // QUERY PARAM
      if (param.options.decoratorType === ParamDecoratorType.QueryField) {
        obj.parameters = obj.parameters || [];
        const name = param.options.name;
        if (!obj.parameters.find((x: any) => x.name === name && x.in === 'query')) {
          obj.parameters.push({
            name,
            in: 'query',
            required: !!param.options.queryParamOptions?.required,
            schema: {
              type: param.type.name.toLowerCase()
            }
          });
        }
      }
      // FULL QUERY OBJECT

      // HEADER PARAM
      if (param.options.decoratorType === ParamDecoratorType.HeaderField) {
        obj.parameters = obj.parameters || [];
        const name = param.options.name;
        if (!obj.parameters.find((x: any) => x.name === name && x.in === 'header')) {
          obj.parameters.push({
            name,
            in: 'header',
            required: !!param.options.queryParamOptions?.required,
            schema: {
              type: param.type.name.toLowerCase()
            }
          });
        }
      }
      // FULL HEADER OBJECT

    }
  });
  return obj;
}

export function getAppSchema() {
  const values: OpenAPIV3.Document = {
    paths: {},
    info: getServerInfo("Test", "Test", "Test"),
    openapi: "3.0.0",
    servers: [getServerObject('0.0.0.0', 8080, 'http', "Public"),
    getServerObject('0.0.0.0', 8081, 'http', "Private")]
  };
  controllers.controllers.forEach(ct => {
    const ctorSchema = buildControllerSchema(ct);
    Object.assign(values.paths, ctorSchema);
  })
  return values;
}

export function getObjectSchema(obj: Class<any>) {
  if (!schemas.has(obj)) {
    const joiSchema = getSchema(obj);
    const schema = joiSwagger(joiSchema);
    schemas.set(obj, schema['swagger']);
  }
  return schemas.get(obj);
}
