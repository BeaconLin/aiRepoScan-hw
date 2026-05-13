import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError} from 'axios';

interface instanceObject {
    [key: string]: string;
}

/**
 * JSON转url参数
 * @param data Json格式数据
 * */
const formatJsonToUrlParams = (data: instanceObject): string => {
    return typeof data === 'object'? Object.keys(data).map((key) => {
        return `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`;
    }).join('&'): '';
};  

const tokenApi = {
    VERSION_BY_PBI: import.meta.env.VITE_API_CORE_ALM + '/core_config/v1/version_by_pbi',
    QUERY_TEST_FEATURE: import.meta.env.VITE_API_CORE_ALM + '/cloud_test/v1/test_protection_net/',
}

const BASE_PREFIX = import.meta.env.VITE_API_BASEURL

// 创建实例
const axiosInstance: AxiosInstance = axios.create({
  // 前缀
  baseURL: BASE_PREFIX,
  // 超时
  timeout: 1000 * 60,
  // 请求头
  headers: {
    'Content-Type': 'application/json',
  },
});

const COREALM_TOKEN = 'CoreALMAuthorization';

// 请求拦截器
axiosInstance.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // TODO 在这里可以加上想要在请求发送前处理的逻辑
    // TODO 比如 loading 等
    if (config.url && Object.values(tokenApi).some(url => config.url.includes(url))) {
      config.headers[COREALM_TOKEN] = localStorage.getItem(COREALM_TOKEN);
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// 响应拦截器
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response.status === 200) {
      return response.data;
    }
    return response.data;
  },
  (error: AxiosError) => {
    const {response} = error;
    if (response) {
      return Promise.reject(response.data);
    }
    return Promise.reject(error);
  },
);
const service = {
  get: (url: string, data?: object, headers?: any): Promise<Response> =>
    axiosInstance.get<object, Response>(url, {
      params: data,
      headers: headers,
    }),
  post: (url: string, data?: any, params?: object, headers?: any): any =>
    axiosInstance.post<object, Response>(url, data, {
      params,
      headers: headers,
    }),
  put: (url: string, data?: object, params?: object): any =>
    axiosInstance.put(url, data, {
      params,
    }),
  delete: (url: string, params?: object): any => axiosInstance.delete<object, Response>(url, {params}),
  upload: (url: string, file: File): any =>
    axiosInstance.post(url, file, {
      headers: {'Content-Type': 'multipart/form-data'},
    }),
  download: (url: string, data: instanceObject): any => {
    const downloadUrl = `${BASE_PREFIX}/${url}?${formatJsonToUrlParams(data)}`;
    window.location.href = downloadUrl;
  },
  getWithCookie: (url: string, data?: object, headers?: any): Promise<Response> =>
    axiosInstance.get<object, Response>(url, {
      params: data,
      headers: headers,
      withCredentials: true,
    }),
};

export default service;