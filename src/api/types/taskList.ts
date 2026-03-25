/**
 * 查询任务列表 GET /api/tasks 响应 `data.list` 单条（与接口文档 1.1 一致）
 * - `assistantVersions` 为逗号分隔字符串
 * - `scanResults` 列表接口固定为空数组，`paginationInfo` 固定为 null
 */
export interface TaskListApiRow {
    taskId: string
    taskName: string
    repoUrl: string
    branch: string
    pathList: string
    s3Path: string
    creator: string
    createTime: string
    taskStatus: string
    assistantVersions: string
    productName: string
    codeLanguage: string | null
    lineNum: number | null
    deptName: string | null
    pduName: string | null
    warnCount: number | null
    scanResults: unknown[]
    paginationInfo: null
    /** 前端展示用（接口文档未列） */
    nameCn?: string
}

/** 查询任务列表 GET /api/tasks 响应 `data` 体（与接口文档 1.1 一致） */
export interface TaskListPageData {
    total: number
    pages: number
    size: number
    page: number
    list: TaskListApiRow[]
}
