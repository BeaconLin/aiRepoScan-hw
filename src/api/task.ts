import { TASK_STATUS } from '../constants/scanTaskConst'
import type {
    IssueResult,
    SaveAnnotationReqBody,
    SaveAnnotationResultData,
    TaskDetailPaginationInfo,
} from './types/saveAnnotation'
import type {
    Annotation,
    AnnotationData,
    AnnotationStatistics,
    ApiEnvelope,
    CreateTaskPayload,
    ScanResult,
    TaskDetail,
    TaskListApiRow,
    TaskListItem,
    TaskListPageData,
    TaskStatus,
    TaskDetailAnnotationStatusFilter,
    TaskDetailReviewStatusFilter,
    ApiDocHttpMeta,
    TaskInfoApiDocData,
    TaskInfoApiDocResponse,
    TaskScanResultAnnotationApiDoc,
    TaskScanResultApiDocRow,
    TaskScanResultsApiDocData,
    TaskScanResultsApiDocResponse,
    UploadScanResultFileResponse,
    UpdateTaskInfoPayload,
    StartTaskScanData,
    SaveAnnotationReviewReqBody,
    SaveAnnotationReviewResultData,
    SubmitHistoryListData,
    ReviewHistoryListData,
    AnnotationTimelineData,
} from './types'
import {
    appendSubmitHistory,
    buildTimeline,
    countReviewStats,
    filterByReviewStatus,
    getReviewDisplayContext,
    getReviewHistoryListData,
    getSubmitHistoryListData,
    nextRoundNo,
    persistedToSaveResult,
    processReviewMock,
    resolveSubmitAction,
    type PersistedAnnotationMeta,
} from './mockAnnotationReview'

/** 与历史 task store 一致，用于任务列表持久化 */
const TASKS_STORAGE_KEY = 'aiRepoScan_tasks'

export type {
    ApiResponseMeta,
    ApiEnvelope,
    UploadScanResultFileInnerMeta,
    UploadScanResultFileResponseData,
    UploadScanResultFileResponse,
    TaskListItem,
    TaskListApiRow,
    TaskListPageData,
    CreateTaskPayload,
    UpdateTaskInfoPayload,
    TaskDetailAnnotationStatusFilter,
    ApiDocHttpMeta,
    TaskInfoApiDocData,
    TaskInfoApiDocResponse,
    TaskScanResultApiDocRow,
    TaskScanResultAnnotationApiDoc,
    TaskScanResultsApiDocData,
    TaskScanResultsApiDocResponse,
} from './types'

function envelopeOk<T>(data: T): ApiEnvelope<T> {
    return {
        data,
        meta: {
            number: 200,
            message: 'OK',
            isSuccess: true
        }
    }
}

function envelopeFail<T>(data: T, number: number, message: string): ApiEnvelope<T> {
    return {
        data,
        meta: {
            number,
            message,
            isSuccess: false
        }
    }
}

function mapTaskDetailToListApiRow(t: TaskDetail): TaskListApiRow {
    const av = Array.isArray(t.assistantVersions)
        ? t.assistantVersions.map((s) => String(s).trim()).filter(Boolean).join(',')
        : String(t.assistantVersions ?? '')
    const warnN = mockScanResults[t.taskId]?.length ?? t.scanResults?.length ?? 0
    const ext = t as TaskDetail & { deptName?: string; pduName?: string }
    return {
        taskId: t.taskId,
        taskName: t.taskName,
        repoUrl: t.repoUrl,
        branch: t.branch,
        pathList: t.pathList,
        s3Path: t.s3Path,
        creator: t.creator,
        createTime: t.createTime,
        taskStatus: t.taskStatus,
        assistantVersions: av,
        productName: t.productName,
        codeLanguage: t.codeLanguage?.trim() ? t.codeLanguage : null,
        lineNum: typeof t.lineNum === 'number' && Number.isFinite(t.lineNum) ? t.lineNum : null,
        deptName: ext.deptName?.trim() ? ext.deptName : null,
        pduName: ext.pduName?.trim() ? ext.pduName : null,
        warnCount: warnN > 0 ? warnN : null,
        scanResults: [],
        paginationInfo: null,
        nameCn: t.nameCn?.trim() ? t.nameCn : undefined,
    }
}

const generateTaskId = (): string => {
    const timestamp = Date.now().toString(16)
    const random = Math.random().toString(16).substring(2, 10)
    return `T${timestamp}-${random.substring(0, 4)}-${random.substring(4, 8)}-${random.substring(8, 12)}-${random.substring(12, 20)}`
}

/** 短工号无接口 nameCn 时的演示用映射；生产环境以接口返回为准 */
const W3_CREATOR_NAME_CN: Record<string, string> = {
    a00559876: '张三',
    a00559877: '李四',
    a00559878: '王五',
    t00598420: '田园',
}

/**
 * 解析创建人中文名：优先接口/存储中的 nameCn，否则按短工号查表补全。
 * 仅本模块内使用；与 TaskDetailView 中同名逻辑保持一致。
 */
function resolveTaskCreatorNameCn(
    creatorW3: string,
    explicitNameCn?: string | null,
): string {
    const e = explicitNameCn?.trim()
    if (e) return e
    const w = (creatorW3 || '').trim()
    return W3_CREATOR_NAME_CN[w] || ''
}

function pickExplicitNameCnFromRaw(raw: Record<string, unknown>): string | undefined {
    for (const key of ['nameCn', 'creatorNameCn', 'creatorCn'] as const) {
        const v = raw[key]
        if (v != null && String(v).trim() !== '') return String(v).trim()
    }
    return undefined
}

const normalizeStoredTask = (raw: Record<string, unknown>): TaskDetail => {
    const pl = raw.pathList
    const pathList = Array.isArray(pl) ? pl.join(',') : String(pl ?? '')
    let av = raw.assistantVersions
    if (typeof av === 'string') {
        av = av.split(',').map((s: string) => s.trim()).filter(Boolean)
    }
    if (!Array.isArray(av)) {
        av = []
    }
    const base: TaskDetail = {
        taskId: String(raw.taskId ?? ''),
        taskName: String(raw.taskName ?? ''),
        repoUrl: String(raw.repoUrl ?? ''),
        branch: String(raw.branch ?? ''),
        pathList,
        assistantVersions: av as string[],
        creator: String(raw.creator ?? ''),
        nameCn: resolveTaskCreatorNameCn(
            String(raw.creator ?? ''),
            pickExplicitNameCnFromRaw(raw),
        ),
        createTime: String(raw.createTime ?? ''),
        taskStatus: (raw.taskStatus || TASK_STATUS.NOT_STARTED) as TaskStatus,
        codeLanguage: String(raw.codeLanguage ?? 'Unknown'),
        lineNum: Number(raw.lineNum) || 0,
        productName: String(raw.productName ?? ''),
        s3Path: String(raw.s3Path ?? ''),
        scanResults: []
    }
    const ext = base as TaskDetail & {
        deptName?: string | null
        pduName?: string | null
        warnCountOverride?: number | null
    }
    const dn = raw.deptName ?? raw.dept_name
    const pn = raw.pduName ?? raw.pdu_name
    if (dn != null && String(dn).trim() !== '') ext.deptName = String(dn).trim()
    if (pn != null && String(pn).trim() !== '') ext.pduName = String(pn).trim()
    const wo = raw.warnCountOverride
    if (wo != null && Number.isFinite(Number(wo))) ext.warnCountOverride = Number(wo)
    base.hostUrl = String(raw.hostUrl ?? raw.host_url ?? '').trim()
    base.modelName = String(raw.modelName ?? raw.model_name ?? '').trim()
    base.rescan = raw.rescan === true || raw.rescan === 'true'
    const progress = raw.progress
    if (progress != null && String(progress).trim() !== '') {
        base.progress = String(progress).trim()
    }
    return base
}

// 内置 Mock 任务详情（基于 defaultTasks）；localStorage 恢复时会与内置字段合并
const BUILTIN_MOCK_TASK_DETAILS: Record<string, TaskDetail> = {
    'T00112233-4455-6677-8899-aabbccddeeff': {
        taskId: 'T00112233-4455-6677-8899-aabbccddeeff',
        taskName: '前端代码扫描任务',
        // 较长 Git 地址，用于任务详情页「代码仓 Git 地址」换行展示验证
        repoUrl:
            'https://codehub-y.huawei.com/Enterprise/CloudPlatform/ServiceComponent/ComDB_ADF/SubModule/RepositoryScanningTools/LongPathSegmentForUiWrapVerification/AnotherVeryLongDirectoryNameThatShouldWrapInTaskDetailView/files?ref=master&path=src/views/taskManagement/TaskDetailView.vue&branch=feature/repo-url-line-wrap-manual-test',
        branch: 'main',
        pathList: 'src,main',
        assistantVersions: ['v2.0.0', 'v2.1.0'],
        creator: 'a00559876',
        nameCn: '张三',
        createTime: '2024-01-15 10:30:00',
        taskStatus: '已完成',
        codeLanguage: 'JavaScript',
        lineNum: 1.5,
        productName: 'ServiceComponent',
        s3Path: 'RepoScan/测试任务/aiMemorySafeCheckResult.json',
        progress: '100/100',
        scanResults: []
    },
    'T11223344-5566-7788-99aa-bbccddeeff00': {
        taskId: 'T11223344-5566-7788-99aa-bbccddeeff00',
        taskName: '后端API扫描任务',
        repoUrl: 'https://github.com/example/backend.git',
        branch: 'develop',
        pathList: 'app,config',
        assistantVersions: ['v1.1.0'],
        creator: 'a00559877',
        nameCn: '李四',
        createTime: '2024-01-14 14:20:00',
        taskStatus: '进行中',
        codeLanguage: 'Python',
        lineNum: 2.5,
        productName: 'UDM',
        s3Path: 's3://ai-repo-scan/results/T11223344-5566-7788-99aa-bbccddeeff00',
        progress: '52/180',
        scanResults: []
    },
    'T22334455-6677-8899-aabb-ccddeeff0011': {
        taskId: 'T22334455-6677-8899-aabb-ccddeeff0011',
        taskName: '移动端代码扫描',
        repoUrl: 'https://github.com/example/mobile.git',
        branch: 'master',
        pathList: 'ios,android',
        assistantVersions: ['v2.0.0'],
        creator: 'a00559876',
        nameCn: '张三',
        createTime: '2024-01-13 09:15:00',
        taskStatus: '未开始',
        codeLanguage: 'Swift',
        lineNum: 0.8,
        productName: '移动应用',
        s3Path: 's3://ai-repo-scan/results/T22334455-6677-8899-aabb-ccddeeff0011',
        progress: '0/0',
        scanResults: []
    },
    'T01020304-0506-0708-090a-0b0c0d0e0f01': {
        taskId: 'T01020304-0506-0708-090a-0b0c0d0e0f01',
        taskName: '网络服务安全扫描',
        repoUrl: 'https://codehub.huawei.com/CloudCore/NetService/gateway.git',
        branch: 'release',
        pathList: 'src/main,src/test',
        assistantVersions: ['v2.0.0'],
        creator: 'a00559878',
        nameCn: '王五',
        createTime: '2026-03-16 09:00:00',
        taskStatus: TASK_STATUS.NOT_STARTED,
        codeLanguage: 'Java',
        lineNum: 3.2,
        productName: 'NetService',
        s3Path: 's3://ai-repo-scan/results/T01020304-0506-0708-090a-0b0c0d0e0f01',
        progress: '0/0',
        scanResults: []
    },
    'T01020304-0506-0708-090a-0b0c0d0e0f02': {
        taskId: 'T01020304-0506-0708-090a-0b0c0d0e0f02',
        taskName: '数据库访问层扫描（Mock·扫描进行中）',
        repoUrl: 'https://codehub.huawei.com/UDM/DataAccess/dal.git',
        branch: 'master',
        pathList: 'dal,orm',
        assistantVersions: ['v1.1.0', 'v2.0.0'],
        creator: 'a00559877',
        nameCn: '李四',
        createTime: '2026-03-15 14:30:00',
        taskStatus: TASK_STATUS.RUNNING,
        codeLanguage: 'Go',
        lineNum: 1.2,
        productName: 'UDM',
        s3Path: 's3://ai-repo-scan/results/T01020304-0506-0708-090a-0b0c0d0e0f02',
        progress: '67/100',
        scanResults: []
    },
    'T01020304-0506-0708-090a-0b0c0d0e0f03': {
        taskId: 'T01020304-0506-0708-090a-0b0c0d0e0f03',
        taskName: '配置中心模块扫描（Mock·扫描启动失败）',
        repoUrl: 'https://codehub.huawei.com/Platform/ConfigCenter/config-server.git',
        branch: 'develop',
        pathList: 'config,plugins',
        assistantVersions: ['v2.0.0'],
        creator: 't00598420',
        nameCn: '田园',
        createTime: '2026-03-14 11:20:00',
        taskStatus: TASK_STATUS.FAILED,
        codeLanguage: 'Java',
        lineNum: 0.6,
        productName: 'ConfigCenter',
        s3Path: 's3://ai-repo-scan/results/T01020304-0506-0708-090a-0b0c0d0e0f03',
        hostUrl: 'http://127.0.0.1:8765',
        modelName: 'repo-scan-mock-model',
        progress: '31/95',
        scanResults: []
    },
    'T01020304-0506-0708-090a-0b0c0d0e0f04': {
        taskId: 'T01020304-0506-0708-090a-0b0c0d0e0f04',
        taskName: '消息队列客户端扫描（Mock·扫描完成零告警）',
        repoUrl: 'https://github.com/example/mq-client.git',
        branch: 'main',
        pathList: 'src',
        assistantVersions: ['v1.0.0'],
        creator: 'a00559876',
        nameCn: '张三',
        createTime: '2026-03-13 16:45:00',
        taskStatus: TASK_STATUS.COMPLETED,
        codeLanguage: 'C++',
        lineNum: 2.1,
        productName: 'Messaging',
        s3Path: 's3://ai-repo-scan/results/T01020304-0506-0708-090a-0b0c0d0e0f04',
        progress: '100/100',
        scanResults: []
    },
    'T01020304-0506-0708-090a-0b0c0d0e0f06': {
        taskId: 'T01020304-0506-0708-090a-0b0c0d0e0f06',
        taskName: '认证授权服务扫描',
        repoUrl: 'https://codehub.huawei.com/Security/AuthService/oauth2.git',
        branch: 'release',
        pathList: 'authz,authn',
        assistantVersions: ['v2.0.0'],
        creator: 'a00559877',
        nameCn: '李四',
        createTime: '2026-03-11 09:30:00',
        taskStatus: TASK_STATUS.NOT_STARTED,
        codeLanguage: 'TypeScript',
        lineNum: 1.8,
        productName: 'Security',
        s3Path: 's3://ai-repo-scan/results/T01020304-0506-0708-090a-0b0c0d0e0f06',
        progress: '0/0',
        scanResults: []
    },
}

const mockTaskDetails: Record<string, TaskDetail> = Object.fromEntries(
    Object.entries(BUILTIN_MOCK_TASK_DETAILS).map(([id, task]) => [id, { ...task }]),
)

/** localStorage 中缺少 progress 等字段时，用内置 mock 任务补全 */
function reconcileMockTaskDetails(): void {
    for (const [id, builtin] of Object.entries(BUILTIN_MOCK_TASK_DETAILS)) {
        const stored = mockTaskDetails[id]
        if (!stored) {
            mockTaskDetails[id] = { ...builtin }
            continue
        }
        if (!stored.progress?.trim() && builtin.progress) {
            stored.progress = builtin.progress
        }
    }
}

// 存储标注数据（按任务ID和warn_uuid存储）
const annotationsData: Record<string, Record<string, PersistedAnnotationMeta>> = {
    'T00112233-4455-6677-8899-aabbccddeeff': {
        // 需要修改 (0)
        'w00112233-4455-6677-8899-aabbccddeeff': {
            issue_result: 0,
            annotator: 'a00559876',
            annotationTime: '2024-01-15 14:30:25',
            reviewStatus: 1,
            reviewerUserId: 't00598420',
            reviewerUserName: '田园',
            reviewTime: '2024-01-16 10:00:00',
            reviewComment: '结论合理',
        },
        // 无需修改的问题 (1) — 已驳回
        'w11223344-5566-7788-99aa-bbccddeeff00': {
            issue_result: 1,
            annotator: 'a00559877',
            annotationTime: '2024-01-15 15:20:10',
            reviewStatus: 2,
            reviewerUserId: 't00598420',
            reviewerUserName: '田园',
            reviewTime: '2024-01-16 11:00:00',
            reviewComment: '请补充误报依据后重新提交',
        },
        // 问题误报 (2)
        'w22334455-6677-8899-aabb-ccddeeff0011': {
            issue_result: 2,
            annotator: 'a00559876',
            annotationTime: '2024-01-15 16:10:45'
        },
        // 需要修改 (0)
        'w33445566-7788-99aa-bbcc-ccddeeff0011': {
            issue_result: 0,
            annotator: 'a00559878',
            annotationTime: '2024-01-15 17:05:30'
        },
        // 无需修改的问题 (1)
        'w44556677-8899-aabb-bbcc-ccddeeff0011': {
            issue_result: 1,
            annotator: 'a00559876',
            annotationTime: '2024-01-15 18:15:20'
        },
        // w55667788-99aa-aabb-bbcc-ccddeeff0011 保持未标注状态
        // 问题误报 (2)
        'w66778899-aabb-bbcc-ccdd-ccddeeff0011': {
            issue_result: 2,
            annotator: 'a00559877',
            annotationTime: '2024-01-15 19:30:15'
        }
    }
}

/** mockScanResults 单行：与接口文档 1.2.2 / 扫描结果标准结构一致 */
type MockScanResultRow = TaskScanResultApiDocRow

function parseMockConfidence(confRaw: unknown): number {
    if (typeof confRaw === 'number' && Number.isFinite(confRaw)) return confRaw
    return Number.parseFloat(String(confRaw ?? '0').replace(/%/g, '')) || 0
}

function normalizeMockScanResultRow(row: unknown, fallbackSelfId: number): MockScanResultRow {
    const r = row as Record<string, unknown>
    const indexRaw = r.index
    const indexNum =
        indexRaw === undefined || indexRaw === null ? null : Number(indexRaw)
    const selfRaw = r.self_increment_id
    const self_increment_id =
        typeof selfRaw === 'number' && Number.isFinite(selfRaw)
            ? selfRaw
            : indexNum != null
              ? indexNum
              : fallbackSelfId

    let function_name = String(r.function_name ?? '')
    if (!function_name) {
        const ctx = String(r.context ?? '')
        const fnMatch = ctx.match(/function\s+(\w+)\s*\(/)
        if (fnMatch) function_name = fnMatch[1]
    }

    let annotation: TaskScanResultAnnotationApiDoc | null = null
    if (r.annotation && typeof r.annotation === 'object') {
        const a = r.annotation as Record<string, unknown>
        annotation = {
            id: Number(a.id),
            warnUuid: String(a.warnUuid ?? ''),
            userId: String(a.userId ?? ''),
            issueResult: Number(a.issueResult),
            reason: a.reason != null ? String(a.reason) : null,
            annotationStatus: Number(a.annotationStatus),
            createTime: String(a.createTime ?? ''),
            updateTime: String(a.updateTime ?? ''),
            userName: a.userName != null ? String(a.userName) : null,
            userDepartment: a.userDepartment != null ? String(a.userDepartment) : null,
            taskId: a.taskId != null ? String(a.taskId) : null,
        }
    }

    return {
        file_name: String(r.file_name ?? r.fileName ?? ''),
        function_name,
        start_line: Number(r.start_line ?? r.warn_line ?? r.line ?? 0),
        end_line: Number(r.end_line ?? r.warn_line ?? r.line ?? 0),
        code_snippet: String(r.code_snippet ?? r.warn_code_block ?? r.code_block ?? ''),
        context: String(r.context ?? ''),
        func_uuid: String(r.func_uuid ?? ''),
        self_increment_id,
        check_function_id:
            r.check_function_id === undefined || r.check_function_id === null
                ? null
                : String(r.check_function_id),
        index: null,
        rule_name: String(r.rule_name ?? ''),
        warn_line: Number(r.warn_line ?? r.line ?? 0),
        warn_code_block: String(r.warn_code_block ?? r.code_block ?? ''),
        warn: String(r.warn ?? ''),
        reason: r.reason != null ? String(r.reason) : '',
        confidence: parseMockConfidence(r.confidence),
        warn_uuid: String(r.warn_uuid ?? r.id ?? ''),
        annotation,
    }
}

const normalizeMockScanResultRows = (rows: unknown[]): MockScanResultRow[] =>
    rows.map((row, idx) => normalizeMockScanResultRow(row, idx + 1))

let mockSaveAnnotationIdSeq = 1

function formatAnnotationResponseTime(d: Date = new Date()): string {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** 无持久化 id 时按 warnUuid 生成稳定 mock id */
function mockAnnotationIdForWarnUuid(warnUuid: string): number {
    let h = 0
    for (let i = 0; i < warnUuid.length; i++) {
        h = (Math.imul(31, h) + warnUuid.charCodeAt(i)) | 0
    }
    return (Math.abs(h) % 900_000) + 1
}

/** 与 mockScanResults 中 w5427cb40… 行内 annotation 字段结构一致 */
function rowAnnToAnnotation(
    a: TaskScanResultAnnotationApiDoc,
    warnUuid: string,
    taskId: string,
): Annotation {
    const issueRaw = a.issueResult
    const issueResult =
        typeof issueRaw === 'number' && Number.isFinite(issueRaw) ? issueRaw : Number(issueRaw)
    return {
        id: Number(a.id) || mockAnnotationIdForWarnUuid(warnUuid),
        warnUuid: String(a.warnUuid || warnUuid),
        userId: String(a.userId ?? ''),
        issueResult: Number.isFinite(issueResult) ? issueResult : 0,
        reason: a.reason != null ? String(a.reason) : null,
        annotationStatus: Number(a.annotationStatus) || 1,
        reviewStatus: (a.reviewStatus ?? 0) as 0 | 1 | 2,
        reviewerUserId: a.reviewerUserId != null ? String(a.reviewerUserId) : null,
        reviewerUserName: a.reviewerUserName != null ? String(a.reviewerUserName) : null,
        reviewTime: a.reviewTime != null ? String(a.reviewTime) : null,
        reviewComment: a.reviewComment != null ? String(a.reviewComment) : null,
        finalIssueResult:
            a.finalIssueResult != null && Number.isFinite(Number(a.finalIssueResult))
                ? Number(a.finalIssueResult)
                : null,
        createTime: String(a.createTime ?? ''),
        updateTime: String(a.updateTime ?? a.createTime ?? ''),
        userName: a.userName != null ? String(a.userName) : null,
        userDepartment: a.userDepartment != null ? String(a.userDepartment) : null,
        taskId: a.taskId != null ? String(a.taskId) : taskId,
    }
}

function annDataToAnnotation(warnUuid: string, taskId: string, ann: PersistedAnnotationMeta): Annotation {
    const time = ann.annotationTime?.trim() || formatAnnotationResponseTime()
    return {
        id: ann.recordId ?? mockAnnotationIdForWarnUuid(warnUuid),
        warnUuid,
        userId: ann.annotator,
        issueResult: ann.issue_result as number,
        reason: ann.reason ?? null,
        annotationStatus: 1,
        reviewStatus: ann.reviewStatus ?? 0,
        reviewerUserId: ann.reviewerUserId ?? null,
        reviewerUserName: ann.reviewerUserName ?? null,
        reviewTime: ann.reviewTime ?? null,
        reviewComment: ann.reviewComment ?? null,
        finalIssueResult:
            ann.finalIssueResult != null ? (ann.finalIssueResult as number) : null,
        createTime: time,
        updateTime: time,
        userName: null,
        userDepartment: null,
        taskId,
    }
}

/**
 * 合并行内 annotation（如 w5427cb40…）与 annotationsData 持久化标注；
 * 以行内结构为标准，annotationsData 覆盖用户最新保存的 issueResult / userId 等。
 */
function buildMockScanResultAnnotation(
    warnUuid: string,
    taskId: string,
    rowAnn: TaskScanResultAnnotationApiDoc | null | undefined,
    persisted?: PersistedAnnotationMeta,
): Annotation | null {
    const hasRow = rowAnn != null
    const hasPersisted =
        persisted != null &&
        persisted.issue_result !== null &&
        persisted.issue_result !== undefined

    if (!hasRow && !hasPersisted) return null
    if (hasRow && !hasPersisted) return rowAnnToAnnotation(rowAnn!, warnUuid, taskId)
    if (!hasRow && hasPersisted) return annDataToAnnotation(warnUuid, taskId, persisted!)

    const base = rowAnnToAnnotation(rowAnn!, warnUuid, taskId)
    const p = persisted!
    const time = p.annotationTime?.trim() || base.updateTime
    return {
        ...base,
        issueResult: p.issue_result as number,
        userId: p.annotator,
        reason: p.reason !== undefined ? (p.reason ?? null) : base.reason,
        annotationStatus: 1,
        reviewStatus: p.reviewStatus ?? 0,
        reviewerUserId: p.reviewerUserId ?? null,
        reviewerUserName: p.reviewerUserName ?? null,
        reviewTime: p.reviewTime ?? null,
        reviewComment: p.reviewComment ?? null,
        finalIssueResult:
            p.finalIssueResult != null ? (p.finalIssueResult as number) : null,
        updateTime: time,
        id: p.recordId ?? base.id,
    }
}

function scanAnnotationToApiDoc(a: Annotation): TaskScanResultAnnotationApiDoc {
    return {
        id: a.id,
        warnUuid: a.warnUuid,
        userId: a.userId,
        issueResult: a.issueResult,
        reason: a.reason,
        annotationStatus: a.annotationStatus,
        reviewStatus: a.reviewStatus ?? null,
        reviewerUserId: a.reviewerUserId ?? null,
        reviewerUserName: a.reviewerUserName ?? null,
        reviewTime: a.reviewTime ?? null,
        reviewComment: a.reviewComment ?? null,
        finalIssueResult: a.finalIssueResult ?? null,
        createTime: a.createTime,
        updateTime: a.updateTime,
        userName: a.userName,
        userDepartment: a.userDepartment,
        taskId: a.taskId,
    }
}

function mockRowToScanResult(
    r: MockScanResultRow,
    taskId: string,
    ann?: PersistedAnnotationMeta,
): ScanResult {
    const warnUuid = r.warn_uuid
    const annotation = buildMockScanResultAnnotation(warnUuid, taskId, r.annotation, ann)
    const issueResult = (annotation?.issueResult ?? null) as IssueResult
    const hasActiveAnnotation = annotation != null && annotation.annotationStatus === 1
    const reviewCtx = getReviewDisplayContext(taskId, warnUuid, hasActiveAnnotation)
    return {
        warn_uuid: warnUuid,
        file_name: r.file_name,
        rule_name: r.rule_name,
        warn_line: r.warn_line,
        warn_code_block: r.warn_code_block,
        code_snippet: r.code_snippet,
        context: r.context,
        warn: r.warn,
        check_function_id: r.check_function_id,
        confidence: String(r.confidence),
        start_line: r.start_line,
        end_line: r.end_line,
        func_uuid: r.func_uuid,
        index: r.index,
        function_name: r.function_name,
        self_increment_id: r.self_increment_id,
        reason: r.reason != null && String(r.reason).trim() !== '' ? String(r.reason) : null,
        issue_result: issueResult,
        annotator: annotation?.userId ?? ann?.annotator,
        annotationTime: annotation?.updateTime ?? ann?.annotationTime,
        annotation,
        lastReview: reviewCtx?.lastReview ?? null,
        rejectedAnnotationSnapshot: reviewCtx?.rejectedSnapshot ?? null,
    }
}

/** 将 mockScanResults 中各行对齐为标准扫描结果结构 */
const reconcileMockScanResults = (): void => {
    for (const taskId of Object.keys(mockScanResults)) {
        const rows = mockScanResults[taskId]
        if (rows?.length) {
            mockScanResults[taskId] = normalizeMockScanResultRows(rows)
        }
    }
}

/** Mock 扫描规则名（与线上一致：CWD-编号 + 描述） */
const MOCK_CWD_RULE_NAMES = [
    'CWD-1040不正确的null结束符/缓冲区溢出',
    'CWD-1026访问已释放内存（悬空指针）',
    'CWD-1007不正确的逐位操作',
    'CWD-1031空指针解引用（临时对象析构后访问）',
    'CWD-1016内存操作函数的源缓冲区访问长度设置不正确',
    'CWD-1022内存申请释放未配对',
    'CWD-1001未初始化变量使用',
    'CWD-1002数组越界访问',
    'CWD-1003双重释放',
    'CWD-1004整数溢出',
    'CWD-1005格式化字符串漏洞',
    'CWD-1008空指针解引用',
    'CWD-1009资源泄露',
    'CWD-1010竞态条件',
] as const

// Mock 扫描结果数据
const mockScanResults: Record<string, MockScanResultRow[]> = {
    'T00112233-4455-6677-8899-aabbccddeeff': normalizeMockScanResultRows([{
            file_name: 'UserProfile.vue',
            function_name: 'processUserInput',
            start_line: 40,
            end_line: 50,
            code_snippet: 'const result = eval(userInput);',
            context: 'function processUserInput(userInput) {\n  // 处理用户输入\n  const result = eval(userInput);\n  return result;\n}',
            func_uuid: 'func-uuid-001',
            self_increment_id: 1,
            check_function_id: 'func-001',
            index: null,
            rule_name: MOCK_CWD_RULE_NAMES[0],
            warn_line: 45,
            warn_code_block: 'const result = eval(userInput);',
            warn: '使用了不安全的eval函数，可能导致代码注入攻击。建议使用JSON.parse()或其他安全的解析方法。',
            reason: '当处理不可信的用户输入时调用 eval，攻击者可注入任意 JavaScript 并在当前作用域执行，可能导致数据泄露、会话劫持或页面被篡改。',
            confidence: 85,
            warn_uuid: 'w00112233-4455-6677-8899-aabbccddeeff',
            annotation: null
        },
        {
            file_name: 'api.js',
            function_name: 'renderList',
            start_line: 125,
            end_line: 132,
            code_snippet: 'document.getElementById("list").innerHTML += item;',
            context: 'for (let i = 0; i < items.length; i++) {\n  const item = items[i];\n  document.getElementById("list").innerHTML += item;\n}',
            func_uuid: 'func-uuid-002',
            self_increment_id: 2,
            check_function_id: 'func-002',
            index: null,
            rule_name: MOCK_CWD_RULE_NAMES[1],
            warn_line: 128,
            warn_code_block: 'document.getElementById("list").innerHTML += item;',
            warn: '在循环中进行了DOM操作，可能导致性能瓶颈。建议先构建完整的HTML字符串，然后一次性更新DOM。',
            reason: '在循环中频繁读写 DOM（innerHTML）会触发多次重排与重绘，列表项较多时页面响应变慢，滚动与交互可能出现明显卡顿。',
            confidence: 90,
            warn_uuid: 'w11223344-5566-7788-99aa-bbccddeeff00',
            annotation: null
        },
        {
            file_name: 'user.js',
            function_name: 'getUserInfo',
            start_line: 65,
            end_line: 70,
            code_snippet: 'let user_name = "test";',
            context: 'function getUserInfo() {\n  let user_name = "test";\n  let user_age = 25;\n  return { user_name, user_age };\n}',
            func_uuid: 'func-uuid-003',
            self_increment_id: 3,
            check_function_id: 'func-003',
            index: null,
            rule_name: MOCK_CWD_RULE_NAMES[2],
            warn_line: 67,
            warn_code_block: 'let user_name = "test";',
            warn: '变量命名不符合规范，建议使用驼峰命名（camelCase）。应改为userName。',
            reason: '项目约定使用驼峰命名（camelCase）。混用下划线命名会降低可读性，并在跨模块协作时增加理解与重构成本。',
            confidence: 75,
            warn_uuid: 'w22334455-6677-8899-aabb-ccddeeff0011',
            annotation: null
        },
        {
            warn_uuid: 'w33445566-7788-99aa-bbcc-ccddeeff0011',
            file_name: 'HomePage.vue',
            rule_name: MOCK_CWD_RULE_NAMES[3],
            warn_line: 203,
            warn_code_block: '<div v-html="userContent"></div>',
            code_snippet: '<div v-html="userContent"></div>',
            context: '<template>\n  <div class="home-page">\n    <div v-html="userContent"></div>\n  </div>\n</template>',
            warn: '未对用户输入进行XSS防护处理，直接使用v-html可能导致XSS攻击。建议对用户输入进行转义处理或使用安全的渲染方法。',
            reason: '当 userContent 含有恶意脚本且通过 v-html 原样插入 DOM 时，脚本会在用户浏览器中执行，可能导致 Cookie 窃取、钓鱼或页面内容被篡改。',
            check_function_id: 'func-004',
            confidence: 95,
            start_line: 200,
            end_line: 206,
            func_uuid: 'func-uuid-004',
            index: 4,
            annotation: null
        },
        {
            warn_uuid: 'w44556677-8899-aabb-bbcc-ccddeeff0011',
            file_name: 'request.js',
            rule_name: MOCK_CWD_RULE_NAMES[4],
            warn_line: 89,
            warn_code_block: 'return data.items[0].name;',
            code_snippet: 'return data.items[0].name;',
            context: 'function getFirstItemName(response) {\n  const data = response.data;\n  return data.items[0].name;\n}',
            warn: '缺少错误处理机制，如果data或items为空或undefined，可能导致程序崩溃。建议添加空值检查和错误处理。',
            reason: '当接口返回空数组、items 缺失或结构异常时，直接访问 items[0] 会抛出运行时错误，导致调用方逻辑中断或页面白屏。',
            check_function_id: 'func-005',
            confidence: 80,
            start_line: 87,
            end_line: 91,
            func_uuid: 'func-uuid-005',
            index: 5,
            annotation: null
        },
        {
            warn_uuid: 'w55667788-99aa-aabb-bbcc-ccddeeff0011',
            file_name: 'DataTable.vue',
            rule_name: MOCK_CWD_RULE_NAMES[5],
            warn_line: 156,
            warn_code_block: '<div v-for="item in largeList" :key="item.id">',
            code_snippet: '<div v-for="item in largeList" :key="item.id">',
            context: '<template>\n  <div class="data-table">\n    <div v-for="item in largeList" :key="item.id">\n      {{ item.name }}\n    </div>\n  </div>\n</template>',
            warn: '大量数据未使用虚拟滚动，可能导致页面卡顿。建议使用虚拟滚动组件（如el-virtual-list）来优化性能。',
            reason: 'largeList 条目较多时一次性渲染全部 DOM 节点，会占用大量内存并拖慢首次渲染与滚动性能，影响表格类页面的可用性。',
            check_function_id: 'func-006',
            confidence: 88,
            start_line: 154,
            end_line: 159,
            func_uuid: 'func-uuid-006',
            index: 6,
            annotation: null
        },
        {
            warn_uuid: 'w66778899-aabb-bbcc-ccdd-ccddeeff0011',
            file_name: 'validator.js',
            rule_name: MOCK_CWD_RULE_NAMES[6],
            warn_line: 34,
            warn_code_block: 'function validateForm(form) {',
            code_snippet: 'function validateForm(form) {',
            context: 'function validateForm(form) {\n  // 验证用户名\n  // 验证密码\n  // 验证邮箱\n  // ... 200行代码\n  return isValid;\n}',
            warn: '函数过长，建议拆分为多个小函数，提高代码可读性和可维护性。',
            reason: '单函数超过 200 行时，分支与副作用交织，单元测试与代码审查成本上升，后续修改更容易引入回归缺陷。',
            check_function_id: 'func-007',
            confidence: 70,
            start_line: 34,
            end_line: 234,
            func_uuid: 'func-uuid-007',
            index: 7,
            annotation: null
        },
        {
            warn_uuid: 'w5427cb40-aa79-4f99-aabd-f77da06222a9',
            file_name: 'sdc/domain/libcompiler/adr_compile.c',
            rule_name: MOCK_CWD_RULE_NAMES[7],
            warn_line: 51,
            warn_code_block: ';',
            code_snippet: '',
            context: '',
            warn: '内存分配后没有检查分配的大小是否足够后续操作，可能导致缓冲区溢出。应确保分配的内存大小足够容纳所有操作。',
            reason: '当实际写入长度超过已分配缓冲区时，可能覆盖相邻内存，引发崩溃、数据损坏或潜在的安全漏洞。',
            check_function_id: null,
            confidence: 0,
            start_line: 43,
            end_line: 72,
            func_uuid: '5f10f739-1927-4a93-bf6b-cbec62c0061e',
            index: 8,
            annotation: {
                id: 16,
                warnUuid: 'w5427cb40-aa79-4f99-aabd-f77da06222a9',
                userId: 't00598420',
                issueResult: 1,
                reason: null,
                annotationStatus: 1,
                createTime: '2026-03-10 10:01:41',
                updateTime: '2026-03-10 10:01:41',
                userName: null,
                userDepartment: null,
                taskId: null
            }
        }
    ]),
    'T11223344-5566-7788-99aa-bbccddeeff00': [],
    'T22334455-6677-8899-aabb-ccddeeff0011': [],
    'T01020304-0506-0708-090a-0b0c0d0e0f01': [],
    'T01020304-0506-0708-090a-0b0c0d0e0f02': [],
    'T01020304-0506-0708-090a-0b0c0d0e0f03': [],
    'T01020304-0506-0708-090a-0b0c0d0e0f04': [],
    'T01020304-0506-0708-090a-0b0c0d0e0f06': []
}

reconcileMockScanResults()

const persistTasksToStorage = (): void => {
    try {
        const arr = Object.values(mockTaskDetails)
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(arr))
    } catch (e) {
        console.error('保存任务列表失败:', e)
    }
}

/** 从 localStorage 恢复任务；若有数据则覆盖内置 mock，保持与旧版 store 行为一致 */
const hydrateTasksFromStorage = (): void => {
    try {
        const stored = localStorage.getItem(TASKS_STORAGE_KEY)
        if (!stored) return
        const parsed = JSON.parse(stored) as unknown
        if (!Array.isArray(parsed) || parsed.length === 0) return

        for (const k of Object.keys(mockTaskDetails)) {
            delete mockTaskDetails[k]
        }
        for (const k of Object.keys(mockScanResults)) {
            delete mockScanResults[k]
        }

        for (const item of parsed) {
            if (!item || typeof item !== 'object' || !('taskId' in item)) continue
            const raw = item as Record<string, unknown>
            const id = String(raw.taskId)
            const detail = normalizeStoredTask(raw)
            const builtin = BUILTIN_MOCK_TASK_DETAILS[id]
            if (builtin && !detail.progress?.trim() && builtin.progress) {
                detail.progress = builtin.progress
            }
            mockTaskDetails[id] = detail
            const sr = raw.scanResults
            if (Array.isArray(sr) && sr.length > 0) {
                mockScanResults[id] = normalizeMockScanResultRows(sr)
            } else {
                mockScanResults[id] = []
            }
        }
    } catch (e) {
        console.error('加载任务列表失败:', e)
    }
}

hydrateTasksFromStorage()
reconcileMockTaskDetails()
reconcileMockScanResults()

/** 演示任务「前端代码扫描」补充更多扫描结果行，便于详情页分页调试（本地 mock 且存在该任务时生效） */
;(function appendExtraMockScanResultsForDemoTask(): void {
    const tid = 'T00112233-4455-6677-8899-aabbccddeeff'
    const list = mockScanResults[tid] as unknown[] | undefined
    if (!list) return
    /** 与详情页展示上限一致，避免 mock 条数过多 */
    const targetMax = 20
    if (list.length >= targetMax) return
    const rules = [...MOCK_CWD_RULE_NAMES]
    const files = [
        'api/auth.ts',
        'utils/crypto.js',
        'config/db.js',
        'server/handler.go',
        'workers/sync.ts',
        'src/views/Login.vue'
    ]
    const need = targetMax - list.length
    for (let i = 0; i < need; i++) {
        const idx = list.length + 1
        list.push(
            normalizeMockScanResultRow(
                {
                    warn_uuid: `w-extra-${String(idx).padStart(2, '0')}-aaaa-bbbb-cccc-${String(100000 + idx).padStart(12, '0')}`,
                    file_name: files[(idx - 1) % files.length],
                    function_name: 'example',
                    rule_name: rules[(idx - 1) % rules.length],
                    warn_line: 20 + i * 3,
                    warn_code_block: '// TODO: review',
                    code_snippet:
                        '// example \n // example \n // example \n // example \n // example'
                        + '// example \n // example \n // example \n // example \n // example',
                    context: 'function example() {\n  // ...\n}',
                    warn: `Mock 扫描问题 #${idx}：用于分页演示，请检查相关代码路径与配置。`,
                    check_function_id: null,
                    confidence: 60 + (i % 35),
                    start_line: 18 + i * 3,
                    end_line: 24 + i * 3,
                    func_uuid: `func-extra-uuid-${idx}`,
                    self_increment_id: idx,
                    index: null,
                    reason: '',
                    annotation: null,
                },
                idx,
            ),
        )
    }
})()

// 获取任务的标注数据
const getAnnotationsForTask = (taskId: string): Record<string, PersistedAnnotationMeta> => {
    return annotationsData[taskId] || {}
}

/**
 * 查询任务列表（带过滤），与 GET `/api/tasks` 一致
 * @param pageNum 必填，当前页码（从 1 起）
 * @param pageSize 必填，每页条数
 * @param creator 可选，创建人筛选
 * @param taskStatus 可选，任务状态筛选
 * @param taskName 可选，任务名称模糊筛选
 * @param deptName 可选，部门名称模糊筛选
 * @param pduName 可选，PDU名称模糊筛选
 */
export const queryTaskList = async (
    pageNum: number,
    pageSize: number,
    creator?: string,
    taskStatus?: string,
    taskName?: string,
    deptName?: string,
    pduName?: string,
): Promise<ApiEnvelope<TaskListPageData>> => {
    let rows = Object.values(mockTaskDetails)
    const c = creator?.trim()
    if (c) {
        rows = rows.filter((t) => t.creator === c)
    }
    const st = taskStatus?.trim()
    if (st) {
        rows = rows.filter((t) => t.taskStatus === st)
    }
    const tn = taskName?.trim()
    if (tn) {
        const q = tn.toLowerCase()
        rows = rows.filter((t) => t.taskName.toLowerCase().includes(q))
    }
    const dn = deptName?.trim()
    if (dn) {
        const q = dn.toLowerCase()
        rows = rows.filter((t) => {
            const ext = t as TaskDetail & { deptName?: string | null }
            const val = (ext.deptName ?? '').trim().toLowerCase()
            return val.includes(q)
        })
    }
    const pn = pduName?.trim()
    if (pn) {
        const q = pn.toLowerCase()
        rows = rows.filter((t) => {
            const ext = t as TaskDetail & { pduName?: string | null }
            const val = (ext.pduName ?? '').trim().toLowerCase()
            return val.includes(q)
        })
    }
    rows.sort((a, b) => b.createTime.localeCompare(a.createTime))

    const total = rows.length
    const size = Math.max(1, pageSize || 8)
    const pages = Math.max(1, Math.ceil(total / size) || 1)
    let page = Math.max(1, pageNum || 1)
    if (page > pages) {
        page = pages
    }
    const start = (page - 1) * size
    const slice = rows.slice(start, start + size)
    const list: TaskListApiRow[] = slice.map((t) => mapTaskDetailToListApiRow(t))

    return envelopeOk({
        total,
        pages,
        size,
        page,
        list,
    })
}

/**
 * 创建任务（Mock：写入内存并持久化到 localStorage）
 */
/**
 * 更新任务信息（Mock：写入 mockTaskDetails 并持久化 localStorage）
 * 与接口文档 1.5 响应 `{ meta, data: null }` 一致；不修改 creator / createTime / nameCn。
 *
 * 路径：`PUT /api/tasks/{taskId}`（见接口文档 1.5、taskManagementService）。
 */
export const updateTaskInfo = async (
    taskId: string,
    payload: UpdateTaskInfoPayload,
): Promise<ApiEnvelope<null>> => {
    await new Promise((r) => setTimeout(r, 0))
    const t = mockTaskDetails[taskId]
    if (!t) {
        return envelopeFail(null, 404, '未找到任务')
    }
    const avStr = (payload.assistantVersions ?? '').trim()
    const avParts = avStr.split(',').map((s) => s.trim()).filter(Boolean)
    t.taskName = (payload.taskName ?? '').trim() || t.taskName
    t.repoUrl = (payload.repoUrl ?? '').trim() || t.repoUrl
    t.branch = (payload.branch ?? '').trim() || t.branch
    t.pathList = payload.pathList == null ? '' : String(payload.pathList).trim()
    t.s3Path = (payload.s3Path ?? '').trim() || t.s3Path
    t.taskStatus = (payload.taskStatus as TaskStatus) || t.taskStatus
    t.assistantVersions = avParts.length > 0 ? avParts : ['v1.0.0']
    t.productName = (payload.productName ?? '').trim() || t.productName
    t.codeLanguage =
        payload.codeLanguage == null || String(payload.codeLanguage).trim() === ''
            ? 'Unknown'
            : String(payload.codeLanguage).trim()
    t.lineNum =
        payload.lineNum == null || !Number.isFinite(Number(payload.lineNum))
            ? 0
            : Number(payload.lineNum)
    const ext = t as TaskDetail & {
        deptName?: string | null
        pduName?: string | null
        warnCountOverride?: number | null
    }
    ext.deptName = payload.deptName == null ? null : String(payload.deptName).trim() || null
    ext.pduName = payload.pduName == null ? null : String(payload.pduName).trim() || null
    t.hostUrl = payload.hostUrl == null ? '' : String(payload.hostUrl).trim()
    t.modelName = payload.modelName == null ? '' : String(payload.modelName).trim()
    t.rescan = payload.rescan === true
    if (payload.warnCount == null) {
        delete ext.warnCountOverride
    } else {
        const w = Number(payload.warnCount)
        ext.warnCountOverride = Number.isFinite(w) ? w : null
    }
    persistTasksToStorage()
    return envelopeOk(null)
}

/**
 * 启动扫描（Mock：「未开始」「失败」「已完成」可启动；排队中/进行中不可；校验 hostUrl / modelName 非空；成功后置为排队中）
 */
export const startTaskScan = async (taskId: string): Promise<ApiEnvelope<StartTaskScanData>> => {
    await new Promise((r) => setTimeout(r, 0))
    const t = mockTaskDetails[taskId]
    if (!t) {
        return envelopeFail(null, 404, '未找到任务')
    }
    const st = t.taskStatus
    if (st === TASK_STATUS.QUEUED) {
        return envelopeFail(null, 400, '任务排队中，无法再次启动扫描')
    }
    if (st === TASK_STATUS.RUNNING) {
        return envelopeFail(null, 400, '任务进行中，无法再次启动扫描')
    }
    if (st !== TASK_STATUS.NOT_STARTED && st !== TASK_STATUS.FAILED && st !== TASK_STATUS.COMPLETED) {
        return envelopeFail(null, 400, '当前任务状态不允许启动扫描')
    }
    const host = (t.hostUrl || '').trim()
    const model = (t.modelName || '').trim()
    if (!host || !model) {
        return envelopeFail(null, 400, '请先填写并保存本机启动URL与模型名称')
    }
    t.taskStatus = TASK_STATUS.QUEUED
    persistTasksToStorage()
    return envelopeOk({
        message: '扫描任务已启动',
        taskId,
        taskStatus: t.taskStatus,
    })
}

export const createTaskApi = async (payload: CreateTaskPayload): Promise<ApiEnvelope<TaskDetail>> => {
    const taskId = generateTaskId()
    const now = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).replace(/\//g, '-')

    const avParts = payload.assistantVersions
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    const assistantVersions = avParts.length > 0 ? avParts : ['v1.0.0']

    const task: TaskDetail = {
        taskId,
        taskName: payload.taskName,
        repoUrl: payload.repoUrl,
        branch: payload.branch,
        pathList: payload.pathList ?? '',
        assistantVersions,
        creator: payload.creator,
        nameCn: resolveTaskCreatorNameCn(payload.creator, payload.nameCn),
        createTime: now,
        taskStatus: TASK_STATUS.NOT_STARTED,
        codeLanguage: payload.codeLanguage || 'Unknown',
        lineNum: payload.lineNum ?? 0,
        productName: payload.productName,
        s3Path: `s3://ai-repo-scan/results/${taskId}`,
        progress: '0/0',
        scanResults: []
    }
    mockTaskDetails[taskId] = task
    mockScanResults[taskId] = []
    persistTasksToStorage()
    return envelopeOk(task)
}

const DEFAULT_BATCH_ASSISTANT = '内存安全v1.0.0'

function validateBatchTaskItem(item: import('./types').BatchCreateTaskItem, rowIndex: number): string | null {
    const name = (item.taskName || '').trim()
    if (!name) return `第 ${rowIndex} 行：任务名称不能为空`
    if (name.length < 2 || name.length > 50) return `第 ${rowIndex} 行：任务名称长度需在 2 到 50 个字符`
    const repo = (item.repoUrl || '').trim()
    if (!repo) return `第 ${rowIndex} 行：代码仓Git地址不能为空`
    if (!/^https:\/\/[^\s/]+\/[^\s?]+\.git$/i.test(repo)) {
        return `第 ${rowIndex} 行：代码仓Git地址格式无效`
    }
    if (!(item.branch || '').trim()) return `第 ${rowIndex} 行：扫描分支不能为空`
    if (!(item.productName || '').trim()) return `第 ${rowIndex} 行：产品名称不能为空`
    const hostUrl = (item.hostUrl || '').trim()
    const modelName = (item.modelName || '').trim()
    if ((hostUrl && !modelName) || (!hostUrl && modelName)) {
        return `第 ${rowIndex} 行：本机启动URL与模型名称需同时填写或同时留空`
    }
    return null
}

function createTaskFromBatchItem(
    item: import('./types').BatchCreateTaskItem,
    creator: string,
    nameCn?: string,
): TaskDetail {
    const taskId = generateTaskId()
    const now = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).replace(/\//g, '-')

    const avRaw = (item.assistantVersions || DEFAULT_BATCH_ASSISTANT).trim()
    const avParts = avRaw.split(',').map((s) => s.trim()).filter(Boolean)
    const assistantVersions = avParts.length > 0 ? avParts : [DEFAULT_BATCH_ASSISTANT]

    const task: TaskDetail = {
        taskId,
        taskName: item.taskName.trim(),
        repoUrl: item.repoUrl.trim(),
        branch: item.branch.trim(),
        pathList: item.pathList?.trim() ?? '',
        assistantVersions,
        creator,
        nameCn: resolveTaskCreatorNameCn(creator, nameCn),
        createTime: now,
        taskStatus: TASK_STATUS.NOT_STARTED,
        codeLanguage: item.codeLanguage?.trim() || 'Unknown',
        lineNum: item.lineNum ?? 0,
        productName: item.productName.trim(),
        s3Path: `s3://ai-repo-scan/results/${taskId}`,
        hostUrl: item.hostUrl?.trim() || '',
        modelName: item.modelName?.trim() || '',
        progress: '0/0',
        scanResults: [],
    }
    mockTaskDetails[taskId] = task
    mockScanResults[taskId] = []
    return task
}

/** 批量创建任务（Mock：POST `/api/tasks/batch`） */
export const batchCreateTasksApi = async (
    payload: import('./types').BatchCreateTaskPayload,
): Promise<ApiEnvelope<import('./types').BatchCreateTaskData>> => {
    const tasks = payload.tasks ?? []
    if (tasks.length === 0) {
        return envelopeFail(
            { totalCount: 0, successCount: 0, failureCount: 0, results: [] },
            400,
            '任务列表不能为空',
        )
    }
    if (tasks.length > 100) {
        return envelopeFail(
            { totalCount: tasks.length, successCount: 0, failureCount: tasks.length, results: [] },
            400,
            '单次最多创建 100 条任务',
        )
    }

    const creator = (payload.creator || '').trim()
    const results: import('./types').BatchCreateTaskResultItem[] = []
    let successCount = 0

    for (let i = 0; i < tasks.length; i++) {
        const rowIndex = i + 1
        const item = tasks[i]
        const err = validateBatchTaskItem(item, rowIndex)
        if (err) {
            results.push({
                rowIndex,
                success: false,
                taskName: item.taskName,
                message: err.replace(/^第 \d+ 行：/, ''),
            })
            continue
        }
        const task = createTaskFromBatchItem(item, creator, payload.nameCn)
        successCount++
        results.push({
            rowIndex,
            success: true,
            taskId: task.taskId,
            taskName: task.taskName,
        })
    }

    if (successCount > 0) {
        persistTasksToStorage()
    }

    const failureCount = tasks.length - successCount
    return envelopeOk({
        totalCount: tasks.length,
        successCount,
        failureCount,
        results,
    })
}

/**
 * 删除任务
 */
export const deleteTaskById = async (taskId: string): Promise<ApiEnvelope<boolean>> => {
    if (!mockTaskDetails[taskId]) {
        return envelopeFail(false, 404, '未找到任务')
    }
    delete mockTaskDetails[taskId]
    delete mockScanResults[taskId]
    delete annotationsData[taskId]
    persistTasksToStorage()
    return envelopeOk(true)
}

/**
 * 上传扫描结果文件（Mock：与 POST `/api/tasks/{taskId}/uploadDataSet`、接口文档 1.4 响应结构一致）
 */
export const uploadScanResultFile = async (
    taskId: string,
    file: File,
    _userId: string
): Promise<UploadScanResultFileResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 200))
    const path = `AIRepoScan/${taskId}/${file.name}`
    const t = mockTaskDetails[taskId]
    if (t) {
        t.s3Path = path
        persistTasksToStorage()
    }
    return {
        data: {
            meta: {
                isSuccess: true,
                message: '上传成功',
                number: 200,
            },
            data: path,
        },
    }
}

function filterScanResultsByReviewStatus(
    results: ScanResult[],
    reviewStatus: string | undefined,
): ScanResult[] {
    const raw = reviewStatus?.trim()
    if (!raw) return results
    return results.filter((r) => {
        const hasAnn = r.annotation != null && r.issue_result !== null
        const rs = r.annotation?.reviewStatus
        return filterByReviewStatus(raw, rs, hasAnn)
    })
}

function filterScanResultsByAnnotationStatus(
    results: ScanResult[],
    annotationStatus: string
): ScanResult[] {
    const raw = annotationStatus == null ? '' : String(annotationStatus).trim()
    if (raw === '') {
        return results
    }
    if (raw === 'unmarked') {
        return results.filter((r) => r.issue_result === null)
    }
    const n = Number.parseInt(raw, 10)
    if (!Number.isNaN(n)) {
        return results.filter((r) => r.issue_result === n)
    }
    return results
}

// 与接口文档 1.2.1 / 1.2.2 一致的 HTTP 响应形（meta + data），供本地模拟

function metaDocOk(): ApiDocHttpMeta {
    return { isSuccess: true, message: 'OK', number: 200 }
}

function metaDocFail(number: number, message: string): ApiDocHttpMeta {
    return { isSuccess: false, message, number }
}

function scanResultToApiDocRow(
    r: ScanResult & Partial<Pick<TaskScanResultApiDocRow, 'function_name' | 'self_increment_id'>>,
    selfIncrementId: number,
): TaskScanResultApiDocRow {
    const confRaw = r.confidence
    const confidence = parseMockConfidence(confRaw)
    const annotation: TaskScanResultAnnotationApiDoc | null = r.annotation
        ? scanAnnotationToApiDoc(r.annotation)
        : null
    return {
        file_name: r.file_name,
        function_name: r.function_name?.trim() ? r.function_name : '',
        start_line: r.start_line,
        end_line: r.end_line,
        code_snippet: r.code_snippet ?? '',
        context: r.context ?? '',
        func_uuid: r.func_uuid ?? '',
        self_increment_id: selfIncrementId,
        check_function_id: r.check_function_id,
        index: r.index,
        rule_name: r.rule_name,
        warn_line: r.warn_line,
        warn_code_block: r.warn_code_block,
        warn: r.warn,
        reason: r.reason ?? '',
        confidence,
        warn_uuid: r.warn_uuid,
        annotation,
    }
}

/**
 * 模拟 GET `/api/tasks/{taskId}/info` 成功/失败响应（结构对齐接口文档 1.2.1）
 */
export async function getTaskInfo(taskId: string): Promise<TaskInfoApiDocResponse> {
    await new Promise((r) => setTimeout(r, 0))
    const t = mockTaskDetails[taskId]
    if (!t) {
        return { meta: metaDocFail(404, '未找到任务'), data: null }
    }
    const warnN = (mockScanResults[taskId]?.length ?? 0) || 0
    const ext = t as TaskDetail & {
        deptName?: string | null
        pduName?: string | null
        warnCountOverride?: number | null
    }
    const warnCountDisplay =
        typeof ext.warnCountOverride === 'number' && Number.isFinite(ext.warnCountOverride)
            ? ext.warnCountOverride
            : warnN
    const data: TaskInfoApiDocData = {
        taskId: t.taskId,
        taskName: t.taskName,
        repoUrl: t.repoUrl,
        branch: t.branch,
        pathList: t.pathList,
        assistantVersions: Array.isArray(t.assistantVersions) ? [...t.assistantVersions] : [],
        creator: t.creator,
        createTime: t.createTime,
        taskStatus: t.taskStatus,
        codeLanguage: t.codeLanguage,
        lineNum: t.lineNum,
        productName: t.productName,
        s3Path: t.s3Path,
        warnCount: warnCountDisplay,
        deptName: ext.deptName ?? null,
        pduName: ext.pduName ?? null,
        hostUrl: t.hostUrl ?? '',
        modelName: t.modelName ?? '',
        rescan: t.rescan === true,
        progress: t.progress ?? '',
        scanResults: null,
        paginationInfo: null,
    }
    return { meta: metaDocOk(), data }
}

/**
 * 模拟 GET `/api/tasks/{taskId}/scan-results`（query：pageNum、pageSize、ruleName、annotation）
 * 响应结构对齐接口文档 1.2.2
 */
export async function getTaskScanResults(
    taskId: string,
    pageNum: number,
    pageSize: number,
    ruleName?: string,
    annotation?: string,
    reviewStatus?: string,
): Promise<TaskScanResultsApiDocResponse> {
    await new Promise((r) => setTimeout(r, 0))
    const taskDetail = mockTaskDetails[taskId]
    if (!taskDetail) {
        return { meta: metaDocFail(404, '未找到任务'), data: null }
    }

    const results = mockScanResults[taskId] || []
    const annotations = getAnnotationsForTask(taskId)
    let scanResults: ScanResult[] = results.map((r, idx) => {
        const uuid = r.warn_uuid || `warn-${idx}`
        return mockRowToScanResult({ ...r, warn_uuid: uuid }, taskId, annotations[uuid])
    })

    const annFilter = annotation == null ? '' : String(annotation).trim()
    scanResults = filterScanResultsByAnnotationStatus(scanResults, annFilter)
    scanResults = filterScanResultsByReviewStatus(scanResults, reviewStatus)
    const rn = ruleName?.trim()
    if (rn) {
        scanResults = scanResults.filter((r) => (r.rule_name || '').trim() === rn)
    }

    const totalCount = scanResults.length
    const ps = Math.max(1, pageSize || 10)
    const totalPages = Math.max(1, Math.ceil(totalCount / ps) || 1)
    let pn = Math.max(1, pageNum || 1)
    if (pn > totalPages) pn = totalPages
    const start = (pn - 1) * ps
    const pageSlice = scanResults.slice(start, start + ps)

    const paginationInfo: TaskDetailPaginationInfo = {
        totalPages,
        pageSize: ps,
        hasPrevious: pn > 1,
        hasNext: pn < totalPages,
        currentPage: pn,
        totalCount,
    }

    const rows: TaskScanResultApiDocRow[] = pageSlice.map((r, i) =>
        scanResultToApiDocRow(r, start + i + 1),
    )

    return {
        meta: metaDocOk(),
        data: { scanResults: rows, paginationInfo },
    }
}

/**
 * 通过 taskId 获取任务详情（与 `taskManagementService.getTaskDetail` 入参一致）
 * @param taskId - 任务ID
 * @param pageNum - 页码（与接口 query `pageNum` 一致；mock 对 scanResults 做分页切片）
 * @param pageSize - 每页条数（与接口 query `pageSize` 一致）
 * @param annotationStatus - 标注状态筛选（真实接口 query；mock 在返回前过滤 scanResults）
 * @returns {Promise<ApiEnvelope<TaskDetail>>} 任务详情（data + meta）
 */
export const getTaskDetail = async (
    taskId: string,
    pageNum: number,
    pageSize: number,
    annotationStatus: TaskDetailAnnotationStatusFilter | string = ''
): Promise<ApiEnvelope<TaskDetail>> => {
    // 直接从 mock 数据中获取任务信息
    const taskDetail = mockTaskDetails[taskId]

    if (!taskDetail) {
        throw new Error(`未找到任务ID为 ${taskId} 的任务详情`)
    }

    // 获取扫描结果（如果任务已完成）
    let scanResults: ScanResult[] = []
    if (taskDetail.taskStatus === TASK_STATUS.COMPLETED) {
        const results = mockScanResults[taskId] || []

        // 从内存中加载已标注的数据
        const annotations = getAnnotationsForTask(taskId)
        
        // 处理扫描结果数据，兼容旧数据格式
        scanResults = results.map((r, idx) => {
            const uuid = r.warn_uuid || `warn-${idx}`
            return mockRowToScanResult({ ...r, warn_uuid: uuid }, taskId, annotations[uuid])
        })
        scanResults = filterScanResultsByAnnotationStatus(scanResults, annotationStatus)
    }

    let finalScanResults = scanResults
    let paginationInfo: TaskDetailPaginationInfo | null = null

    if (taskDetail.taskStatus === TASK_STATUS.COMPLETED) {
        const totalCount = scanResults.length
        const ps = Math.max(1, pageSize || 10)
        const totalPages = Math.max(1, Math.ceil(totalCount / ps) || 1)
        let pn = Math.max(1, pageNum || 1)
        if (pn > totalPages) pn = totalPages
        const start = (pn - 1) * ps
        finalScanResults = scanResults.slice(start, start + ps)
        paginationInfo = {
            totalPages,
            pageSize: ps,
            hasPrevious: pn > 1,
            hasNext: pn < totalPages,
            currentPage: pn,
            totalCount
        }
    }

    const resTask: TaskDetail = {
        ...taskDetail,
        scanResults: finalScanResults,
        paginationInfo
    }

    return envelopeOk(resTask)
}

/**
 * 模拟通过 taskId 获取扫描结果列表
 * @param {string} taskId - 任务ID
 * @returns {Promise<ApiEnvelope<ScanResult[]>>} 扫描结果（data + meta）
 */
export const fetchScanResults = async (taskId: string): Promise<ApiEnvelope<ScanResult[]>> => {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500))

    const results = mockScanResults[taskId] || []

    // 从内存中加载已标注的数据
    const annotations = getAnnotationsForTask(taskId)
    const resultsWithAnnotations: ScanResult[] = results.map((result) =>
        mockRowToScanResult(result, taskId, annotations[result.warn_uuid]),
    )

    return envelopeOk(resultsWithAnnotations)
}

/**
 * 保存标注数据
 * @param reqBody - 标注请求体
 * @returns 成功时 `data` 为标注记录；取消标注时 `data` 为 null
 */
export const saveAnnotationApi = async (
    reqBody: SaveAnnotationReqBody
): Promise<ApiEnvelope<SaveAnnotationResultData | null>> => {
    const { taskId, warnUuid, issueResult, userId } = reqBody

    if (!annotationsData[taskId]) {
        annotationsData[taskId] = {}
    }

    const existing = annotationsData[taskId][warnUuid]
    const existingOwner = existing?.annotator?.trim() ?? ''
    const requestUser = userId?.trim() ?? ''

    if (issueResult === null) {
        if (existingOwner && requestUser && existingOwner !== requestUser) {
            return envelopeFail(null, 403, '仅首次标注人可修改该标注，您无法修改他人标记的结果')
        }
        if (existing) {
            appendSubmitHistory(taskId, warnUuid, {
                annotationId: existing.recordId ?? null,
                action: 'cancel',
                roundNo: nextRoundNo(taskId, warnUuid, 'cancel'),
                userId: requestUser || existingOwner,
                userName: reqBody.userName?.trim() || null,
                userDepartment: null,
                issueResult: null,
                reason: null,
            })
        }
        delete annotationsData[taskId][warnUuid]
        return envelopeOk(null)
    }

    if (existingOwner && requestUser && existingOwner !== requestUser) {
        return envelopeFail(null, 403, '仅首次标注人可修改该标注，您无法修改他人标记的结果')
    }

    const hadExisting = !!existing
    const action = resolveSubmitAction(taskId, warnUuid, hadExisting, false)
    const roundNo = nextRoundNo(taskId, warnUuid, action)
    const now = formatAnnotationResponseTime()

    const recordId = existing?.recordId ?? mockSaveAnnotationIdSeq++
    const meta: PersistedAnnotationMeta = {
        issue_result: issueResult,
        annotator: userId,
        annotationTime: now,
        reason: reqBody.reason ?? '',
        reviewStatus: 0,
        reviewerUserId: null,
        reviewerUserName: null,
        reviewTime: null,
        reviewComment: null,
        finalIssueResult: undefined,
        recordId,
    }

    const submitRow = appendSubmitHistory(taskId, warnUuid, {
        annotationId: recordId,
        action,
        roundNo,
        userId,
        userName: reqBody.userName?.trim() || null,
        userDepartment: null,
        issueResult,
        reason: reqBody.reason ?? null,
        submitTime: now,
    })

    annotationsData[taskId][warnUuid] = meta

    const data: SaveAnnotationResultData = {
        ...persistedToSaveResult(taskId, warnUuid, meta, submitRow.id),
        userName: reqBody.userName?.trim() ? reqBody.userName.trim() : null,
    }

    return envelopeOk(data)
}

export const saveAnnotationReviewApi = async (
    reqBody: SaveAnnotationReviewReqBody,
    reviewerUserId = 'r00123456',
    reviewerUserName: string | null = '评审员',
): Promise<ApiEnvelope<SaveAnnotationReviewResultData | null>> => {
    const { taskId, warnUuid } = reqBody
    const persisted = annotationsData[taskId]?.[warnUuid]
    const result = processReviewMock(reqBody, persisted, reviewerUserId, reviewerUserName)
    if (result.ok === false) {
        return envelopeFail(null, result.number, result.message)
    }
    if (persisted) {
        if (!annotationsData[taskId]) annotationsData[taskId] = {}
        annotationsData[taskId][warnUuid] = persisted
    }
    return envelopeOk(result.data)
}

export const getAnnotationSubmitHistory = async (
    taskId: string,
    warnUuid: string,
): Promise<ApiEnvelope<SubmitHistoryListData>> => {
    await new Promise((r) => setTimeout(r, 0))
    return envelopeOk(getSubmitHistoryListData(taskId, warnUuid))
}

export const getAnnotationReviewHistory = async (
    taskId: string,
    warnUuid: string,
): Promise<ApiEnvelope<ReviewHistoryListData>> => {
    await new Promise((r) => setTimeout(r, 0))
    return envelopeOk(getReviewHistoryListData(taskId, warnUuid))
}

export const getAnnotationTimeline = async (
    taskId: string,
    warnUuid: string,
): Promise<ApiEnvelope<AnnotationTimelineData>> => {
    await new Promise((r) => setTimeout(r, 0))
    return envelopeOk(buildTimeline(taskId, warnUuid))
}

/**
 * 获取任务的标注完成度和状态分布统计信息
 * @param {string} taskId - 任务ID
 * @returns {Promise<ApiEnvelope<AnnotationStatistics>>} 标注统计信息（data + meta）
 */
export const getAnnotationStatistics = async (taskId: string): Promise<ApiEnvelope<AnnotationStatistics>> => {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 300))

    // 获取任务详情
    const taskDetail = mockTaskDetails[taskId]
    if (!taskDetail) {
        throw new Error(`未找到任务ID为 ${taskId} 的任务详情`)
    }

    // 获取扫描结果
    const results = mockScanResults[taskId] || []
    const totalWarnCount = results.length

    // 获取标注数据
    const annotations = getAnnotationsForTask(taskId)
    const annotatedWarnUuids = Object.keys(annotations)
    const annotatedCount = annotatedWarnUuids.length
    const unannotatedCount = totalWarnCount - annotatedCount

    // 计算标注完成率
    const annotationCompletionRate = totalWarnCount > 0 
        ? Number(((annotatedCount / totalWarnCount) * 100).toFixed(2))
        : 0

    // 统计状态分布
    const statusCountMap: Record<number, number> = {
        0: 0, // 需要修改
        1: 0, // 无需修改的问题
        2: 0  // 问题误报
    }

    annotatedWarnUuids.forEach(uuid => {
        const annotation = annotations[uuid]
        if (annotation && annotation.issue_result !== null && annotation.issue_result !== undefined) {
            statusCountMap[annotation.issue_result] = (statusCountMap[annotation.issue_result] || 0) + 1
        }
    })

    // 构建状态分布数组
    const statusDistribution = []

    // 统计已标注的总数（用于计算百分比）
    const totalAnnotated = annotatedCount

    // 与接口文档一致：statusDistribution 仅汇总「已标注」状态
    if (totalAnnotated > 0) {
        statusDistribution.push({
            statusCode: 1,
            statusDescription: '已标注',
            warnCount: totalAnnotated,
            percentage: 100.0
        })
    }

    // 与接口文档附录 A 一致：issue_result 0/1/2 → resultCode 2/1/0
    const annotationDistribution = []
    const docRows: Array<{ resultCode: number; resultDescription: string; count: number }> = [
        { resultCode: 2, resultDescription: '需要修改', count: statusCountMap[0] },
        { resultCode: 1, resultDescription: '无需修改的问题', count: statusCountMap[1] },
        { resultCode: 0, resultDescription: '非问题', count: statusCountMap[2] },
    ]
    for (const row of docRows) {
        if (row.count > 0) {
            const pct =
                totalAnnotated > 0 ? Number(((row.count / totalAnnotated) * 100).toFixed(2)) : 0
            annotationDistribution.push({
                resultCode: row.resultCode,
                resultDescription: row.resultDescription,
                annotationCount: row.count,
                percentage: pct,
            })
        }
    }

    const ruleCountMap: Record<string, number> = {}
    for (const r of results) {
        const name = (r as { rule_name?: string }).rule_name?.trim() || ''
        if (name) ruleCountMap[name] = (ruleCountMap[name] || 0) + 1
    }
    const pad = (n: number) => String(n).padStart(2, '0')
    const now = new Date()
    const updateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    const ruleStatistics = Object.entries(ruleCountMap).map(([ruleName, ruleCount]) => ({
        taskId: taskDetail.taskId,
        ruleName,
        ruleCount,
        updateTime,
    }))

    const statistics: AnnotationStatistics = {
        taskId: taskDetail.taskId,
        taskName: taskDetail.taskName,
        totalWarnCount: totalWarnCount,
        annotatedCount: annotatedCount,
        unannotatedCount: unannotatedCount,
        annotationCompletionRate: annotationCompletionRate,
        statusDistribution: statusDistribution,
        annotationDistribution,
        ruleStatistics,
        ...countReviewStats(taskId, annotations),
    }

    return envelopeOk(statistics)
}

/**
 * 重新统计规则分布（Mock：直接返回成功，由调用方再拉取 getAnnotationStatistics）
 */
export const rerunStatistics = async (
    taskId: string,
    _userId: string,
): Promise<ApiEnvelope<null>> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    if (!mockTaskDetails[taskId]) {
        return envelopeFail(null, 404, `未找到任务ID为 ${taskId} 的任务详情`)
    }
    return envelopeOk(null)
}