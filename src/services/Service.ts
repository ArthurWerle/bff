import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

export class Service {
  constructor(private readonly baseURL: string) {
    this.baseURL = baseURL;
  }

  async get<T>(
    path: string,
    params?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return axios.get(this.baseURL + path, { params, ...config });
  }

  async delete(
    path: string,
    params?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse> {
    return axios.delete(this.baseURL + path, { params, ...config });
  }

  async post<T>(
    path: string,
    data: any,
    params?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return axios.post(this.baseURL + path, data, { params, ...config });
  }

  async put(
    path: string,
    data: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse> {
    return axios.put(this.baseURL + path, data, config);
  }

  async patch(
    path: string,
    data: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse> {
    return axios.patch(this.baseURL + path, data, config);
  }
}
