/** 标注结果类型：0-需要修改, 1-无需修改的问题, 2-问题误报 */
export type IssueResult = 0 | 1 | 2 | null

/**
 * 保存单个缺陷标注内容（与接口文档 2.1、`taskManagementService.saveAnnotationApi` POST body 一致）
 */
export interface SaveAnnotationReqBody {
    taskId: string
    warnUuid: string
    issueResult: IssueResult
    userId: string
    /** 中文姓名，对应用户信息 nameCn */
    userName: string
    reason?: string
}

/** 保存标注成功时 `data` 字段（与接口文档 2.1 响应一致） */
export interface SaveAnnotationResultData {
    id: number
    warnUuid: string
    userId: string
    issueResult: number
    reason: string
    annotationStatus: number
    createTime: string
    updateTime: string
    userName: string | null
    userDepartment: string | null
    taskId: string | null
}
