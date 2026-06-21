/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_CORE_ALM: string
    readonly VITE_API_BASEURL?: string
    /** 设为 true 时使用本地默认用户，不请求登录接口 */
    readonly VITE_USER_MOCK?: string
}
