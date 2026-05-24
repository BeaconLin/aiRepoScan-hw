import type { IssueResult } from '@/api/types/saveAnnotation'
import type {
    AnnotationReviewHistory,
    AnnotationSubmitHistory,
    AnnotationTimelineData,
    RejectedAnnotationSnapshot,
    ReviewHistoryListData,
    ReviewRecordSummary,
    SaveAnnotationReviewReqBody,
    SaveAnnotationReviewResultData,
    SubmitHistoryListData,
    SubmitHistoryAction,
    TimelineEvent,
} from '@/api/types/annotationReview'
import type { SaveAnnotationResultData } from '@/api/types/saveAnnotation'

export interface PersistedAnnotationMeta {
    issue_result: IssueResult
    annotator: string
    annotationTime: string
    reason?: string | null
    reviewStatus?: 0 | 1
    reviewerUserId?: string | null
    reviewerUserName?: string | null
    reviewTime?: string | null
    recordId?: number
}

let submitHistoryIdSeq = 1000
let reviewHistoryIdSeq = 2000

const submitHistoryStore: Record<string, Record<string, AnnotationSubmitHistory[]>> = {}
const reviewHistoryStore: Record<string, Record<string, AnnotationReviewHistory[]>> = {}
const roundNoStore: Record<string, Record<string, number>> = {}

export function formatReviewTime(d: Date = new Date()): string {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function ensureListStore(
    store: Record<string, Record<string, AnnotationSubmitHistory[] | AnnotationReviewHistory[]>>,
    taskId: string,
    warnUuid: string,
): AnnotationSubmitHistory[] | AnnotationReviewHistory[] {
    if (!store[taskId]) store[taskId] = {}
    if (!store[taskId][warnUuid]) store[taskId][warnUuid] = []
    return store[taskId][warnUuid]
}

export function getSubmitHistories(taskId: string, warnUuid: string): AnnotationSubmitHistory[] {
    return submitHistoryStore[taskId]?.[warnUuid] ?? []
}

export function getReviewHistories(taskId: string, warnUuid: string): AnnotationReviewHistory[] {
    return reviewHistoryStore[taskId]?.[warnUuid] ?? []
}

export function getCurrentRoundNo(taskId: string, warnUuid: string): number {
    return roundNoStore[taskId]?.[warnUuid] ?? 1
}

function setRoundNo(taskId: string, warnUuid: string, roundNo: number): void {
    if (!roundNoStore[taskId]) roundNoStore[taskId] = {}
    roundNoStore[taskId][warnUuid] = roundNo
}

export function appendSubmitHistory(
    taskId: string,
    warnUuid: string,
    payload: Omit<AnnotationSubmitHistory, 'id' | 'taskId' | 'warnUuid' | 'submitTime'> & {
        submitTime?: string
    },
): AnnotationSubmitHistory {
    const row: AnnotationSubmitHistory = {
        id: submitHistoryIdSeq++,
        taskId,
        warnUuid,
        submitTime: payload.submitTime ?? formatReviewTime(),
        annotationId: payload.annotationId,
        action: payload.action,
        roundNo: payload.roundNo,
        userId: payload.userId,
        userName: payload.userName,
        userDepartment: payload.userDepartment,
        issueResult: payload.issueResult,
        reason: payload.reason,
    }
    ;(ensureListStore(submitHistoryStore, taskId, warnUuid) as AnnotationSubmitHistory[]).push(row)
    return row
}

export function appendReviewHistory(
    taskId: string,
    warnUuid: string,
    payload: Omit<AnnotationReviewHistory, 'id' | 'taskId' | 'warnUuid' | 'reviewTime'> & {
        reviewTime?: string
    },
): AnnotationReviewHistory {
    const row: AnnotationReviewHistory = {
        id: reviewHistoryIdSeq++,
        taskId,
        warnUuid,
        reviewTime: payload.reviewTime ?? formatReviewTime(),
        submitHistoryId: payload.submitHistoryId,
        annotationId: payload.annotationId,
        action: payload.action,
        reviewerUserId: payload.reviewerUserId,
        reviewerUserName: payload.reviewerUserName,
        rejectReason: payload.rejectReason,
    }
    ;(ensureListStore(reviewHistoryStore, taskId, warnUuid) as AnnotationReviewHistory[]).push(row)
    return row
}

export function findPendingSubmitHistoryId(taskId: string, warnUuid: string): number | null {
    const submits = getSubmitHistories(taskId, warnUuid)
    const reviews = getReviewHistories(taskId, warnUuid)
    const approvedSubmitIds = new Set(
        reviews.filter((r) => r.action === 'approve').map((r) => r.submitHistoryId),
    )
    for (let i = submits.length - 1; i >= 0; i--) {
        const s = submits[i]
        if (s.action === 'cancel') continue
        if (!approvedSubmitIds.has(s.id)) return s.id
    }
    return submits.length > 0 ? submits[submits.length - 1].id : null
}

export function resolveSubmitAction(
    taskId: string,
    warnUuid: string,
    hadExistingAnnotation: boolean,
    isCancel: boolean,
): SubmitHistoryAction {
    if (isCancel) return 'cancel'
    if (hadExistingAnnotation) return 'update'
    const hasReject = getReviewHistories(taskId, warnUuid).some((r) => r.action === 'reject')
    if (hasReject) return 'resubmit'
    return 'submit'
}

export function nextRoundNo(taskId: string, warnUuid: string, action: SubmitHistoryAction): number {
    const current = getCurrentRoundNo(taskId, warnUuid)
    if (action === 'resubmit') {
        const next = current + 1
        setRoundNo(taskId, warnUuid, next)
        return next
    }
    if (action === 'submit' && getSubmitHistories(taskId, warnUuid).length === 0) {
        setRoundNo(taskId, warnUuid, 1)
        return 1
    }
    return current || 1
}

export function persistedToSaveResult(
    taskId: string,
    warnUuid: string,
    meta: PersistedAnnotationMeta,
    submitHistoryId?: number,
): SaveAnnotationResultData {
    return {
        id: meta.recordId ?? 0,
        warnUuid,
        userId: meta.annotator,
        issueResult: meta.issue_result as number,
        reason: meta.reason ?? '',
        annotationStatus: 1,
        reviewStatus: meta.reviewStatus ?? 0,
        reviewerUserId: meta.reviewerUserId ?? null,
        reviewerUserName: meta.reviewerUserName ?? null,
        reviewTime: meta.reviewTime ?? null,
        createTime: meta.annotationTime,
        updateTime: meta.annotationTime,
        userName: null,
        userDepartment: null,
        taskId,
        submitHistoryId,
    }
}

export function buildTimeline(taskId: string, warnUuid: string): AnnotationTimelineData {
    const submits = getSubmitHistories(taskId, warnUuid)
    const reviews = getReviewHistories(taskId, warnUuid)
    const submitMap = new Map(submits.map((s) => [s.id, s]))
    const events: TimelineEvent[] = []

    for (const s of submits) {
        if (s.action === 'cancel') continue
        events.push({
            type: 'submit',
            time: s.submitTime,
            action: s.action,
            issueResult: s.issueResult,
            reason: s.reason,
            userId: s.userId,
            userName: s.userName,
            roundNo: s.roundNo,
            submitHistoryId: s.id,
        })
    }

    for (const r of reviews) {
        events.push({
            type: 'review',
            time: r.reviewTime,
            action: r.action,
            reviewerUserId: r.reviewerUserId,
            reviewerUserName: r.reviewerUserName,
            rejectReason: r.rejectReason,
            submitHistoryId: r.submitHistoryId,
            issueResult: submitMap.get(r.submitHistoryId)?.issueResult ?? null,
            reason: submitMap.get(r.submitHistoryId)?.reason ?? null,
            userId: submitMap.get(r.submitHistoryId)?.userId ?? null,
            userName: submitMap.get(r.submitHistoryId)?.userName ?? null,
            roundNo: submitMap.get(r.submitHistoryId)?.roundNo ?? null,
        })
    }

    events.sort((a, b) => a.time.localeCompare(b.time))
    return { taskId, warnUuid, events }
}

export function getSubmitHistoryListData(taskId: string, warnUuid: string): SubmitHistoryListData {
    const list = [...getSubmitHistories(taskId, warnUuid)].sort((a, b) =>
        b.submitTime.localeCompare(a.submitTime),
    )
    return { taskId, warnUuid, list }
}

export function getReviewHistoryListData(taskId: string, warnUuid: string): ReviewHistoryListData {
    const submitMap = new Map(getSubmitHistories(taskId, warnUuid).map((s) => [s.id, s]))
    const list = [...getReviewHistories(taskId, warnUuid)]
        .sort((a, b) => b.reviewTime.localeCompare(a.reviewTime))
        .map((r) => ({
            ...r,
            submitSnapshot: submitMap.get(r.submitHistoryId) ?? null,
        }))
    return { taskId, warnUuid, list }
}

function buildRejectedSnapshot(
    submitHistoryId: number,
    taskId: string,
    warnUuid: string,
): RejectedAnnotationSnapshot | null {
    const snap = getSubmitHistories(taskId, warnUuid).find((s) => s.id === submitHistoryId)
    if (!snap || snap.issueResult == null) return null
    return {
        issueResult: snap.issueResult,
        reason: snap.reason,
        userId: snap.userId,
        userName: snap.userName,
    }
}

/** 扫描结果列表加载时补充评审展示上下文（驳回快照、最近驳回记录） */
export function getReviewDisplayContext(
    taskId: string,
    warnUuid: string,
    hasActiveAnnotation: boolean,
): { lastReview: ReviewRecordSummary; rejectedSnapshot: RejectedAnnotationSnapshot | null } | null {
    const reviews = [...getReviewHistories(taskId, warnUuid)].sort((a, b) =>
        b.reviewTime.localeCompare(a.reviewTime),
    )
    if (!reviews.length) return null

    const latest = reviews[0]
    if (hasActiveAnnotation) {
        const submits = getSubmitHistories(taskId, warnUuid)
        const hasSubmitAfterReject = submits.some(
            (s) => s.action !== 'cancel' && s.submitTime > latest.reviewTime,
        )
        if (latest.action === 'reject' && hasSubmitAfterReject) return null
    }

    const lastReview: ReviewRecordSummary = {
        action: latest.action,
        reviewerUserId: latest.reviewerUserId,
        reviewerUserName: latest.reviewerUserName,
        reviewTime: latest.reviewTime,
        rejectReason: latest.rejectReason,
    }

    let rejectedSnapshot: RejectedAnnotationSnapshot | null = null
    if (latest.action === 'reject' && !hasActiveAnnotation) {
        rejectedSnapshot = buildRejectedSnapshot(latest.submitHistoryId, taskId, warnUuid)
    }

    return { lastReview, rejectedSnapshot }
}

export type ReviewMockResult =
    | { ok: true; data: SaveAnnotationReviewResultData }
    | { ok: false; number: number; message: string }

export function processReviewMock(
    req: SaveAnnotationReviewReqBody,
    persisted: PersistedAnnotationMeta | undefined,
    reviewerUserId: string,
    reviewerUserName: string | null,
): ReviewMockResult {
    const { taskId, warnUuid, decision, comment } = req

    if (!persisted || persisted.issue_result === null || persisted.issue_result === undefined) {
        return { ok: false, number: 400, message: '当前告警不可评审，仅待评审状态可执行评审操作' }
    }
    if (persisted.reviewStatus === 1) {
        return { ok: false, number: 400, message: '当前告警不可评审，仅待评审状态可执行评审操作' }
    }

    const submitHistoryId = findPendingSubmitHistoryId(taskId, warnUuid)
    if (submitHistoryId == null) {
        return { ok: false, number: 400, message: '未找到待评审的标注提交记录' }
    }

    if (decision === 'reject') {
        const reason = (comment ?? '').trim()
        if (!reason) {
            return { ok: false, number: 400, message: '驳回时必须填写驳回理由' }
        }
        const reviewRow = appendReviewHistory(taskId, warnUuid, {
            submitHistoryId,
            annotationId: persisted.recordId ?? null,
            action: 'reject',
            reviewerUserId,
            reviewerUserName,
            rejectReason: reason,
        })
        const reviewRecord: ReviewRecordSummary = {
            action: 'reject',
            reviewerUserId,
            reviewerUserName,
            reviewTime: reviewRow.reviewTime,
            rejectReason: reason,
        }
        return {
            ok: true,
            data: {
                annotation: null,
                reviewHistoryId: reviewRow.id,
                submitHistoryId,
                reviewRecord,
                rejectedAnnotation: buildRejectedSnapshot(submitHistoryId, taskId, warnUuid),
            },
        }
    }

    const now = formatReviewTime()
    persisted.reviewStatus = 1
    persisted.reviewerUserId = reviewerUserId
    persisted.reviewerUserName = reviewerUserName
    persisted.reviewTime = now
    persisted.annotationTime = now

    const reviewRow = appendReviewHistory(taskId, warnUuid, {
        submitHistoryId,
        annotationId: persisted.recordId ?? null,
        action: 'approve',
        reviewerUserId,
        reviewerUserName,
        rejectReason: comment?.trim() ? comment.trim() : null,
    })

    const reviewRecord: ReviewRecordSummary = {
        action: 'approve',
        reviewerUserId,
        reviewerUserName,
        reviewTime: now,
        rejectReason: comment?.trim() ? comment.trim() : null,
    }

    return {
        ok: true,
        data: {
            annotation: persistedToSaveResult(taskId, warnUuid, persisted, submitHistoryId),
            reviewHistoryId: reviewRow.id,
            submitHistoryId,
            reviewRecord,
            rejectedAnnotation: null,
        },
    }
}

export function countReviewStats(
    taskId: string,
    annotations: Record<string, PersistedAnnotationMeta>,
): {
    pendingReviewCount: number
    approvedReviewCount: number
    rejectedReviewCount: number
} {
    let pendingReviewCount = 0
    let approvedReviewCount = 0
    for (const meta of Object.values(annotations)) {
        if (meta.issue_result == null) continue
        if (meta.reviewStatus === 1) approvedReviewCount++
        else pendingReviewCount++
    }
    const rejectedReviewCount = (reviewHistoryStore[taskId]
        ? Object.values(reviewHistoryStore[taskId]).flat()
        : []
    ).filter((r) => r.action === 'reject').length

    return { pendingReviewCount, approvedReviewCount, rejectedReviewCount }
}

export function filterByReviewStatus(
    reviewStatus: string | undefined,
    annotationReviewStatus: number | null | undefined,
    hasAnnotation: boolean,
): boolean {
    const raw = reviewStatus?.trim()
    if (!raw) return true
    if (raw === '0') return hasAnnotation && annotationReviewStatus !== 1
    if (raw === '1') return hasAnnotation && annotationReviewStatus === 1
    return true
}
