import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { ServerError, MainAppError } from "..";
export class HttpClient {
  protected request: AxiosInstance;

  constructor(baseUrl: string) {
    this.request = axios.create({ baseURL: baseUrl });
  }

  public async get<T>(url: string, config?: AxiosRequestConfig) {
    return this.request
      .get<T>(url, config)
      .then((r: AxiosResponse<T>) => r.data)
      .catch((t: AxiosError) => {
        throw this.handleAxiosError(t);
      });
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.request
      .post<T>(url, data, config)
      .then((r: AxiosResponse<T>) => r.data)
      .catch((t: AxiosError) => {
        throw this.handleAxiosError(t);
      });
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.request
      .put<T>(url, data, config)
      .then((r: AxiosResponse<T>) => r.data)
      .catch((t: AxiosError) => {
        throw this.handleAxiosError(t);
      });
  }

  public async patch<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.request
      .patch<T>(url, data, config)
      .then((r: AxiosResponse<T>) => r.data)
      .catch((t: AxiosError) => {
        throw this.handleAxiosError(t);
      });
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig) {
    return this.request
      .delete(url, config)
      .then((r: AxiosResponse<T>) => r.data)
      .catch((t: AxiosError) => {
        throw this.handleAxiosError(t);
      });
  }

  private handleAxiosError(error: AxiosError): MainAppError {
    if (error.response && error.response.data) {
      const err = new MainAppError();
      err.message = error.response.data.message || error.message;
      err.statusCode = error.response.status;
      err.data = error.response.data;
      return err;
    }
    return new ServerError(error.message);
  }
}
