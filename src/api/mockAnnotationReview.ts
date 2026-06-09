import type { IssueResult, SaveAnnotationResultData } from '@/api/types/saveAnnotation'
import type {
  AnnotationReviewHistory,
  AnnotationSubmitHistory,
  AnnotationTimelineData,
  RejectedAnnotationSnapshot,
  ReviewHistoryListData,
  ReviewRecordSummary,
  SaveAnnotationReviewReqBody,
  SaveAnnotationReviewResultData,
  SubmitHistoryAction,
  SubmitHistoryListData,
  TimelineEvent,
} from '@/api/types/annotationReview'

export interface PersistedAnnotationMeta {
  issue_result: IssueResult
  annotator: string
  annotationTime: string
  reason?: string | null
  reviewStatus?: 0 | 1 | 2
  reviewerUserId?: string | null
  reviewerUserName?: string | null
  reviewTime?: string | null
  reviewComment?: string | null
  finalIssueResult?: IssueResult
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
  const taskStore = store[taskId]!
  if (!taskStore[warnUuid]) {
    taskStore[warnUuid] = []
  }
  return taskStore[warnUuid]!
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
  roundNoStore[taskId]![warnUuid] = roundNo
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
    reviewComment: meta.reviewComment ?? null,
    finalIssueResult:
      meta.finalIssueResult != null ? (meta.finalIssueResult as number) : null,
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
  return {taskId, warnUuid, events}
}

export function getSubmitHistoryListData(taskId: string, warnUuid: string): SubmitHistoryListData {
  const list = [...getSubmitHistories(taskId, warnUuid)].sort((a, b) =>
    b.submitTime.localeCompare(a.submitTime),
  )
  return {taskId, warnUuid, list}
}

export function getReviewHistoryListData(taskId: string, warnUuid: string): ReviewHistoryListData {
  const submitMap = new Map(getSubmitHistories(taskId, warnUuid).map((s) => [s.id, s]))
  const list = [...getReviewHistories(taskId, warnUuid)]
    .sort((a, b) => b.reviewTime.localeCompare(a.reviewTime))
    .map((r) => ({
      ...r,
      submitSnapshot: submitMap.get(r.submitHistoryId) ?? null,
    }))
  return {taskId, warnUuid, list}
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

  const latest = reviews[0]!
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

  return {lastReview, rejectedSnapshot}
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
  const {taskId, warnUuid, decision, comment, finalIssueResult} = req

  if (!persisted || persisted.issue_result === null || persisted.issue_result === undefined) {
    return {ok: false, number: 400, message: '当前告警不可评审，仅未评审状态可执行评审操作'}
  }
  const currentReviewStatus = persisted.reviewStatus ?? 0
  if (currentReviewStatus !== 0) {
    return {ok: false, number: 400, message: '当前告警不可评审，仅未评审状态可执行评审操作'}
  }

  const now = formatReviewTime()

  if (decision === 'reject') {
    const reason = (comment ?? '').trim()
    if (!reason) {
      return {ok: false, number: 400, message: '驳回时必须填写评审意见'}
    }
    persisted.reviewStatus = 2
    persisted.reviewerUserId = reviewerUserId
    persisted.reviewerUserName = reviewerUserName
    persisted.reviewTime = now
    persisted.reviewComment = reason

    const reviewRecord: ReviewRecordSummary = {
      action: 'reject',
      reviewerUserId,
      reviewerUserName,
      reviewTime: now,
      rejectReason: reason,
    }
    return {
      ok: true,
      data: {
        annotation: persistedToSaveResult(taskId, warnUuid, persisted),
        reviewHistoryId: 0,
        submitHistoryId: 0,
        reviewRecord,
        rejectedAnnotation: null,
      },
    }
  }

  persisted.reviewStatus = 1
  persisted.reviewerUserId = reviewerUserId
  persisted.reviewerUserName = reviewerUserName
  persisted.reviewTime = now
  persisted.reviewComment = comment?.trim() ? comment.trim() : null
  if (finalIssueResult !== undefined && finalIssueResult !== null) {
    persisted.finalIssueResult = finalIssueResult as IssueResult
  }

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
      annotation: persistedToSaveResult(taskId, warnUuid, persisted),
      reviewHistoryId: 0,
      submitHistoryId: 0,
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
  let rejectedReviewCount = 0
  for (const meta of Object.values(annotations)) {
    if (meta.issue_result == null) continue
    const rs = meta.reviewStatus ?? 0
    if (rs === 1) approvedReviewCount++
    else if (rs === 2) rejectedReviewCount++
    else pendingReviewCount++
  }

  return {pendingReviewCount, approvedReviewCount, rejectedReviewCount}
}

export function filterByReviewStatus(
  reviewStatus: string | undefined,
  annotationReviewStatus: number | null | undefined,
  hasAnnotation: boolean,
): boolean {
  const raw = reviewStatus?.trim()
  if (!raw) return true
  const rs = annotationReviewStatus ?? 0
  if (raw === '0') return hasAnnotation && rs === 0
  if (raw === '1') return hasAnnotation && rs === 1
  if (raw === '2') return hasAnnotation && rs === 2
  return true
}