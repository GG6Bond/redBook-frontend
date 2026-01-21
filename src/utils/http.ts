import type { AxiosInstance, AxiosRequestConfig } from 'axios'
import axios from 'axios'

// 创建axios实例
const instance: AxiosInstance = axios.create({
  baseURL: '/',
  timeout: 10000,
})

// 请求拦截器：添加Authorization header
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器：处理通用错误
instance.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // 处理401未授权
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      // 如果需要跳转登录页，可以在这里调用router
      window.location.hash = '#/login'
    }
    return Promise.reject(error)
  },
)

// 通用HTTP请求类
export class HttpClient {
  /**
   * GET请求
   */
  static get<T extends Record<string, unknown> = Record<string, unknown>>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return instance.get(url, config).then((res) => res.data)
  }

  /**
   * POST请求
   */
  static post<T extends Record<string, unknown> = Record<string, unknown>>(
    url: string,
    data?: Record<string, unknown>,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return instance.post(url, data, config).then((res) => res.data)
  }

  /**
   * PUT请求
   */
  static put<T extends Record<string, unknown> = Record<string, unknown>>(
    url: string,
    data?: Record<string, unknown>,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return instance.put(url, data, config).then((res) => res.data)
  }

  /**
   * DELETE请求
   */
  static delete<T extends Record<string, unknown> = Record<string, unknown>>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return instance.delete(url, config).then((res) => res.data)
  }

  /**
   * PATCH请求
   */
  static patch<T extends Record<string, unknown> = Record<string, unknown>>(
    url: string,
    data?: Record<string, unknown>,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return instance.patch(url, data, config).then((res) => res.data)
  }
}

export default instance
