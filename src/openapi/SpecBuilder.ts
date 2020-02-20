import joiSwagger from "joi-to-swagger";
import { getMetadata } from "joi-typescript-validator/lib/utils/MetadataHelpers";
import { OpenAPIV3 } from "openapi-types";
import { HttpBroker, HttpVerbs } from "../brokers/http/HttpBroker";
import { IBroker } from "../brokers/IBroker";
import { ParamDecoratorType, ParamDescription } from "../decorators";
import { BaseRouteDefinition, Class } from "../server";
import { Service } from "..";
import { getSchema, FieldDescription } from "joi-typescript-validator";

@Service()
export class SpecBuilder {
  private schemas: Map<Class<any>, any> = new Map();
  private paths: OpenAPIV3.PathsObject = {};

  public getServerPath(server: HttpBroker) {
    return {
      url: "{url}",
      description: server.name,
      variables: {
        url: {
          default: server.getFullPath()
        }
      }
    };
  }

  public getSchemaPath(obj: Class<any> | any) {
    if (!this.schemas.has(obj)) {
      const joiSchema = getSchema(obj);
      const schema = joiSwagger(joiSchema);
      this.schemas.set(obj, schema["swagger"]);
    }
    return `#/components/schemas/${obj.name}`;
  }

  public registerRoute(
    def: BaseRouteDefinition,
    brokers: IBroker[],
    params: ParamDescription[]
  ) {
    const httpBrokers: HttpBroker[] = brokers
      .filter(x => {
        return x.constructor.prototype instanceof HttpBroker;
      })
      .map(x => {
        return x as HttpBroker;
      });
    if (httpBrokers.length === 0) {
      return;
    }
    const server: OpenAPIV3.ServerObject = this.getServerPath(httpBrokers[0]);
    if (httpBrokers.length > 0) {
      server.variables = server.variables || {};
      server.variables.url = server.variables.url || { default: "" };
      server.variables.url["enum"] = server.variables.url["enum"] || [];
    }
    for (let i = 0; i < httpBrokers.length; i++) {
      server.variables!.url!.enum!.push(httpBrokers[i].getFullPath());
    }
    const path: string = this.extractPath(def);
    const obj: OpenAPIV3.PathItemObject = this.paths[path] || {};
    const mappedParams: {
      body: ParamDescription[];
      header: ParamDescription[];
      query: ParamDescription[];
      path: ParamDescription[];
    } = {
      body: [],
      header: [],
      path: [],
      query: []
    };
    params.forEach(p => {
      if (p.options) {
        const paramType = p.options.decoratorType;
        if (
          paramType === ParamDecoratorType.Query ||
          paramType === ParamDecoratorType.QueryField
        ) {
          mappedParams.query.push(p);
        }
        if (
          paramType === ParamDecoratorType.Body ||
          paramType === ParamDecoratorType.BodyField
        ) {
          mappedParams.body.push(p);
        }
        if (
          paramType === ParamDecoratorType.Header ||
          paramType === ParamDecoratorType.HeaderField
        ) {
          mappedParams.header.push(p);
        }
        if (
          paramType === ParamDecoratorType.Params ||
          paramType === ParamDecoratorType.ParamField
        ) {
          mappedParams.path.push(p);
        }
      }
    });

    const operation: OpenAPIV3.OperationObject = {
      tags: [def.controllerCtor.name],
      description: def.handlerName,
      parameters: [
        ...this.buildPathParams(mappedParams.path),
        ...this.buildHeaderParams(mappedParams.header),
        ...this.buildQueryParams(mappedParams.query)
      ],
      servers: [server],
      responses: {}
    };
    const verb: HttpVerbs = (def.method?.toLocaleLowerCase() ||
      "get") as HttpVerbs;
    if (verb !== "get") {
      operation.requestBody = this.buildBodyParams(mappedParams.body);
    }
    obj[verb] = operation;
    this.paths[path] = obj;
  }

  public getDocument(): OpenAPIV3.Document {
    return {
      paths: this.paths,
      components: { schemas: this.getAllSchemas() },
      openapi: "3.0.0",
      info: { title: "test", version: "1.0.0" }
    };
  }

  private buildPathParams(
    params: ParamDescription[]
  ): OpenAPIV3.ParameterObject[] {
    return this.buildParam(params, "path");
  }

  private buildParam(
    params: ParamDescription[],
    inType: "header" | "query" | "path"
  ) {
    return params.reduce(
      (accum: OpenAPIV3.ParameterObject[], x: ParamDescription) => {
        if (x.options?.name) {
          accum.push({
            name: x.options?.name || "",
            in: inType,
            required: inType === 'header' ? !!x.options.headerParamOptions?.required : (inType === 'query'? !!x.options.queryParamOptions?.required: true),
            schema: { type: x.type.name.toLowerCase() }
          });
        } else {
          const objMetadata = getMetadata(x.type);
          if (objMetadata) {
            Object.keys(objMetadata).forEach(fieldName => {
              const item: OpenAPIV3.ParameterObject = {
                name: fieldName,
                in: inType,
                required: !!objMetadata[fieldName].required,
                explode: true
              };
              const obj: FieldDescription = objMetadata[fieldName];
              item.schema = this.getObjectSchema(obj.designType);
              accum.push(item);
            });
          }
        }
        return accum;
      },
      []
    );
  }

  private buildBodyParams(
    params: ParamDescription[]
  ): OpenAPIV3.RequestBodyObject {
    let contentSchema: OpenAPIV3.SchemaObject = { type: "object" };
    params.forEach(param => {
      if (param.options?.decoratorType === ParamDecoratorType.Body) {
        Object.assign(contentSchema, this.getObjectSchema(param.type));
      } else if (
        param.options?.decoratorType === ParamDecoratorType.BodyField
      ) {
        contentSchema.properties = contentSchema.properties || {};
        if (param.options.bodyParamOptions?.required) {
          contentSchema.required = contentSchema.required || [];
          if (!contentSchema.required.find(param.options.name)) {
            contentSchema.required.push(param.options.name);
          }
        }
        if (!contentSchema.properties[param.options.name]) {
          contentSchema.properties[param.options.name] = this.getObjectSchema(
            param.type
          );
        }
      }
    });
    const result: OpenAPIV3.RequestBodyObject = {
      content: {
        "application/json": {
          schema: contentSchema
        }
      }
    };
    return result;
  }

  private buildHeaderParams(params: ParamDescription[]): any[] {
    return this.buildParam(params, "header");
  }

  private buildQueryParams(params: ParamDescription[]): any[] {
    return this.buildParam(params, "query");
  }

  private getObjectSchema(obj: any) {
    if (!this.schemas.has(obj)) {
      const joiSchema = getSchema(obj);
      const schema = joiSwagger(joiSchema);
      this.schemas.set(obj, schema["swagger"]);
    }
    return { $ref: `#/components/schemas/${obj.name}` };
  }

  private extractPath(def: BaseRouteDefinition) {
    let basePart: string = def.base;
    if (basePart && basePart.indexOf("/") !== 0) {
      basePart = `/${basePart}`;
    }
    let controllerPart = def.controller;
    if (controllerPart.indexOf("/") !== 0) {
      controllerPart = `/${controllerPart}`;
    }
    let handlerPart = def.handler;
    const params = this.extractParamNames(handlerPart);
    handlerPart = params
      .map(x => {
        if (x.param) {
          return `{${x.name}}`;
        }
        return x.name;
      })
      .join("/");
    if (handlerPart.indexOf("/") !== 0 && handlerPart.length > 0) {
      handlerPart = `/${handlerPart}`;
    }
    return `${basePart}${controllerPart}${handlerPart}`.replace(/\/\//g, "/");
  }

  private extractParamNames(path: string, separator = "/") {
    const spl = path.split(separator);
    return spl.map(x => {
      const value: { name: string; param: boolean } = { name: x, param: false };
      if (x.length > 0 && x[0] === ":") {
        value.name = x.substr(1);
        value.param = true;
      }
      return value;
    });
  }
  private getAllSchemas() {
    const result: any = {};
    this.schemas.forEach((value: OpenAPIV3.SchemaObject, key: any) => {
      result[key.name] = value;
    });
    return result;
  }
}
