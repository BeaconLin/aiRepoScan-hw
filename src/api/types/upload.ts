/** POST `/api/tasks/{taskId}/uploadDataSet` 内层 meta（与接口文档 1.4 一致） */
export interface UploadScanResultFileInnerMeta {
    isSuccess: boolean
    message: string
    number: number
}

/** 内层 `data` 与 `meta`（与接口文档 1.4 一致） */
export interface UploadScanResultFileResponseData {
    meta: UploadScanResultFileInnerMeta
    /** 上传后的对象路径，如 `AIRepoScan/task_123456/scan_result.json` */
    data: string
}

/**
 * 上传扫描结果完整响应体（与接口文档 1.4 一致：顶层仅 `data`，其内再含 `meta` 与 `data`）
 */
export interface UploadScanResultFileResponse {
    data: UploadScanResultFileResponseData
}
