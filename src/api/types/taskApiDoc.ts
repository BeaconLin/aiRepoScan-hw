import type { TaskDetailPaginationInfo } from '@/api/types/saveAnnotation'

/**
 * 任务详情 scanResults 按标注状态筛选（与 GET `/api/tasks/{taskId}` 的 query 一致）
 * - 空字符串：不过滤
 * - `unmarked`：仅未标注（issue_result 为 null）
 * - `0` / `1` / `2`：对应已标注结果
 */
export type TaskDetailAnnotationStatusFilter = '' | 'unmarked' | '0' | '1' | '2'

// ---------------------------------------------------------------------------
// 与接口文档 1.2.1 / 1.2.2 一致的 HTTP 响应形（meta.success + data），供本地模拟
// ---------------------------------------------------------------------------

/** 接口文档 1.2.x 成功/失败时的 meta 形态 */
export interface ApiDocHttpMeta {
    isSuccess: boolean
    message: string
    number: number
}

/** 1.2.1 `data`（与文档字段一致；无 nameCn） */
export interface TaskInfoApiDocData {
    taskId: string
    taskName: string
    repoUrl: string
    branch: string
    pathList: string
    assistantVersions: string[]
    creator: string
    createTime: string
    taskStatus: string
    codeLanguage: string
    lineNum: number
    productName: string
    s3Path: string
    warnCount: number
    scanResults: null
    paginationInfo: null
}

export interface TaskInfoApiDocResponse {
    meta: ApiDocHttpMeta
    data: TaskInfoApiDocData | null
}

/** 1.2.2 单条扫描结果（与文档示例字段一致） */
export interface TaskScanResultApiDocRow {
    file_name: string
    function_name: string
    start_line: number
    end_line: number
    code_snippet: string
    context: string
    func_uuid: string
    self_increment_id: number
    check_function_id: string | null
    index: number | null
    rule_name: string
    warn_line: number
    warn_code_block: string
    warn: string
    reason: string
    confidence: number
    warn_uuid: string
    annotation: TaskScanResultAnnotationApiDoc | null
}

export interface TaskScanResultAnnotationApiDoc {
    id: number
    warnUuid: string
    userId: string
    issueResult: number
    reason: string | null
    annotationStatus: number
    createTime: string
    updateTime: string
    userName: string | null
    userDepartment: string | null
    taskId: string | null
}

export interface TaskScanResultsApiDocData {
    scanResults: TaskScanResultApiDocRow[]
    paginationInfo: TaskDetailPaginationInfo
}

export interface TaskScanResultsApiDocResponse {
    meta: ApiDocHttpMeta
    data: TaskScanResultsApiDocData | null
}
