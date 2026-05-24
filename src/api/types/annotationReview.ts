/** 评审结论 */
export type ReviewDecision = 'approve' | 'reject'

/** 标注提交历史 action */
export type SubmitHistoryAction = 'submit' | 'update' | 'resubmit' | 'cancel'

/** 评审历史 action */
export type ReviewHistoryAction = 'approve' | 'reject'

/** 扫描结果评审状态筛选 */
export type ReviewStatusFilter = '' | '0' | '1'

/** 标注提交历史（接口文档 §5） */
export interface AnnotationSubmitHistory {
    id: number
    taskId: string
    warnUuid: string
    annotationId: number | null
    action: SubmitHistoryAction
    roundNo: number
    userId: string
    userName: string | null
    userDepartment: string | null
    issueResult: number | null
    reason: string | null
    submitTime: string
}

/** 标注评审历史（接口文档 §6） */
export interface AnnotationReviewHistory {
    id: number
    taskId: string
    warnUuid: string
    submitHistoryId: number
    annotationId: number | null
    action: ReviewHistoryAction
    reviewerUserId: string
    reviewerUserName: string | null
    reviewTime: string
    rejectReason: string | null
    submitSnapshot?: AnnotationSubmitHistory | null
}

/** 操作时间线事件（接口文档 §7） */
export interface TimelineEvent {
    type: 'submit' | 'review'
    time: string
    action: string
    issueResult?: number | null
    reason?: string | null
    userId?: string | null
    userName?: string | null
    roundNo?: number | null
    reviewerUserId?: string | null
    reviewerUserName?: string | null
    rejectReason?: string | null
    submitHistoryId?: number | null
}

/** POST /api/annotations/review 请求体 */
export interface SaveAnnotationReviewReqBody {
    taskId: string
    warnUuid: string
    decision: ReviewDecision
    comment?: string
}

/** 评审结果摘要（供前端评审后展示） */
export interface ReviewRecordSummary {
    action: ReviewHistoryAction
    reviewerUserId: string
    reviewerUserName: string | null
    reviewTime: string
    rejectReason: string | null
}

/** 驳回时被评审标注的快照（主表已清空时供前端只读展示） */
export interface RejectedAnnotationSnapshot {
    issueResult: number
    reason: string | null
    userId: string
    userName: string | null
}

/** POST /api/annotations/review 响应 data */
export interface SaveAnnotationReviewResultData {
    annotation: import('./saveAnnotation').SaveAnnotationResultData | null
    reviewHistoryId: number
    submitHistoryId: number
    reviewRecord?: ReviewRecordSummary
    rejectedAnnotation?: RejectedAnnotationSnapshot | null
}

export interface SubmitHistoryListData {
    taskId: string
    warnUuid: string
    list: AnnotationSubmitHistory[]
}

export interface ReviewHistoryListData {
    taskId: string
    warnUuid: string
    list: AnnotationReviewHistory[]
}

export interface AnnotationTimelineData {
    taskId: string
    warnUuid: string
    events: TimelineEvent[]
}
