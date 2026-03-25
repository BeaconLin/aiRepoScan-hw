import { TASK_STATUS } from '@/constants/scanTaskConst'
import type { IssueResult, TaskDetailPaginationInfo } from '@/api/types/saveAnnotation'

/** 任务状态类型 */
export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS]

/** 标注数据接口 */
export interface AnnotationData {
    issue_result: IssueResult
    annotator: string
    annotationTime: string
    reason?: string | null
}

/** 标注信息接口 */
export interface Annotation {
    id: number
    warnUuid: string
    userId: string
    issueResult: number // 0: 需要修改, 1: 无需修改, 2: 问题误报
    reason: string | null
    annotationStatus: number
    createTime: string
    updateTime: string
    userName: string | null
    userDepartment: string | null
    taskId: string | null
}

/** 扫描结果接口 */
export interface ScanResult {
    warn_uuid: string
    file_name: string
    rule_name: string
    warn_line: number
    warn_code_block: string
    code_snippet: string
    context: string
    warn: string
    check_function_id: string | null
    confidence: string
    start_line: number
    end_line: number
    func_uuid: string
    index: number | null
    reason: string | null
    issue_result: IssueResult
    annotator?: string
    annotationTime?: string
    annotation?: Annotation | null
}

/** 任务详情接口 */
export interface TaskDetail {
    taskId: string
    taskName: string
    repoUrl: string
    branch: string
    pathList: string
    assistantVersions: string[]
    creator: string
    /** 创建人中文名；与 creator（短工号 w3Id）组合展示，持久化与接口对齐 */
    nameCn: string
    createTime: string
    taskStatus: TaskStatus
    codeLanguage: string
    lineNum: number
    productName: string
    s3Path: string
    scanResults: ScanResult[]
    /** 扫描结果分页信息（与接口文档「查询任务详情」一致；未完成或无明细时为 null） */
    paginationInfo?: TaskDetailPaginationInfo | null
}

/** 列表项（不含扫描结果明细） */
export type TaskListItem = Omit<TaskDetail, 'scanResults'>

/** 创建任务入参（与创建表单 / 接口字段对齐） */
export interface CreateTaskPayload {
    taskName: string
    productName: string
    repoUrl: string
    branch: string
    pathList?: string
    creator: string
    /** 创建人中文名，与 creator（w3Id）一并展示 */
    nameCn?: string
    /** 逗号分隔的助手版本，如 "v1.0.0,v2.0.0" */
    assistantVersions: string
    codeLanguage?: string
    lineNum?: number
    deptName?: string
    pduName?: string
}

/** 标注统计信息（getAnnotationStatistics 响应 data） */
export interface AnnotationStatistics {
    taskId: string
    taskName: string
    totalWarnCount: number
    annotatedCount: number
    unannotatedCount: number
    annotationCompletionRate: number
    statusDistribution: Array<{
        statusCode: number
        statusDescription: string
        warnCount: number
        percentage: number
    }>
}
