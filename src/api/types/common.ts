/** 与后端统一：接口元信息 */
export interface ApiResponseMeta {
    number: number
    message: string
    isSuccess: boolean
}

/** 统一响应：仅含 data 与 meta（与 saveAnnotationApi 等一致） */
export interface ApiEnvelope<T> {
    data: T
    meta: ApiResponseMeta
}
