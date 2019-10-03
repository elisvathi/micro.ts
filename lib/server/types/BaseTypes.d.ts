export interface ActionResponse {
    statusCode?: number;
    is_error?: boolean;
    error?: any;
    headers?: any;
    body?: any;
}
export interface ActionRequest {
    qs?: any;
    method?: any;
    headers?: any;
    params?: any;
    body?: any;
    raw?: any;
    path: string;
}
export interface Action {
    request: ActionRequest;
    response?: ActionResponse;
    connection?: any;
}
export interface BaseRouteDefinition {
    base: string;
    controller: string;
    controllerCtor: any;
    handler: string;
    handlerName: string;
    method: string;
    consumers?: number;
    json?: boolean;
}
