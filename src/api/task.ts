import { TASK_STATUS } from '../constants/scanTaskConst'
import type {
    IssueResult,
    SaveAnnotationReqBody,
    SaveAnnotationResultData,
    TaskDetailPaginationInfo,
} from './types/saveAnnotation'

/** 与历史 task store 一致，用于任务列表持久化 */
const TASKS_STORAGE_KEY = 'aiRepoScan_tasks'

// 任务状态类型
type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS]

// 标注数据接口
interface AnnotationData {
    issue_result: IssueResult
    annotator: string
    annotationTime: string
    reason?: string | null
}

// 标注信息接口
interface Annotation {
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

// 扫描结果接口
interface ScanResult {
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

// 任务详情接口
interface TaskDetail {
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

/** POST `/api/tasks/{taskId}/uploadDataSet` 内层 meta（与接口文档 1.4 一致） */
export interface UploadScanResultFileInnerMeta {
    success: boolean
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

/** 列表项（不含扫描结果明细） */
export type TaskListItem = Omit<TaskDetail, 'scanResults'>

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
    return {
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
}

// 标注统计信息接口
interface AnnotationStatistics {
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

// Mock 任务详情数据（基于 defaultTasks）
const mockTaskDetails: Record<string, TaskDetail> = {
    'T00112233-4455-6677-8899-aabbccddeeff': {
        taskId: 'T00112233-4455-6677-8899-aabbccddeeff',
        taskName: '前端代码扫描任务',
        repoUrl: 'https://codehub-y.huawei.com/ServiceComponent/ComDB_ADF/files?ref=master',
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
        scanResults: []
    },
    'T01020304-0506-0708-090a-0b0c0d0e0f02': {
        taskId: 'T01020304-0506-0708-090a-0b0c0d0e0f02',
        taskName: '数据库访问层扫描',
        repoUrl: 'https://codehub.huawei.com/UDM/DataAccess/dal.git',
        branch: 'master',
        pathList: 'dal,orm',
        assistantVersions: ['v1.1.0', 'v2.0.0'],
        creator: 'a00559877',
        nameCn: '李四',
        createTime: '2026-03-15 14:30:00',
        taskStatus: TASK_STATUS.NOT_STARTED,
        codeLanguage: 'Go',
        lineNum: 1.2,
        productName: 'UDM',
        s3Path: 's3://ai-repo-scan/results/T01020304-0506-0708-090a-0b0c0d0e0f02',
        scanResults: []
    },
    'T01020304-0506-0708-090a-0b0c0d0e0f03': {
        taskId: 'T01020304-0506-0708-090a-0b0c0d0e0f03',
        taskName: '配置中心模块扫描',
        repoUrl: 'https://codehub.huawei.com/Platform/ConfigCenter/config-server.git',
        branch: 'develop',
        pathList: 'config,plugins',
        assistantVersions: ['v2.0.0'],
        creator: 't00598420',
        nameCn: '田园',
        createTime: '2026-03-14 11:20:00',
        taskStatus: TASK_STATUS.NOT_STARTED,
        codeLanguage: 'Java',
        lineNum: 0.6,
        productName: 'ConfigCenter',
        s3Path: 's3://ai-repo-scan/results/T01020304-0506-0708-090a-0b0c0d0e0f03',
        scanResults: []
    },
    'T01020304-0506-0708-090a-0b0c0d0e0f04': {
        taskId: 'T01020304-0506-0708-090a-0b0c0d0e0f04',
        taskName: '消息队列客户端扫描',
        repoUrl: 'https://github.com/example/mq-client.git',
        branch: 'main',
        pathList: 'src',
        assistantVersions: ['v1.0.0'],
        creator: 'a00559876',
        nameCn: '张三',
        createTime: '2026-03-13 16:45:00',
        taskStatus: TASK_STATUS.NOT_STARTED,
        codeLanguage: 'C++',
        lineNum: 2.1,
        productName: 'Messaging',
        s3Path: 's3://ai-repo-scan/results/T01020304-0506-0708-090a-0b0c0d0e0f04',
        scanResults: []
    },
    'T01020304-0506-0708-090a-0b0c0d0e0f05': {
        taskId: 'T01020304-0506-0708-090a-0b0c0d0e0f05',
        taskName: '容器镜像构建脚本扫描',
        repoUrl: 'https://codehub.huawei.com/CloudNative/buildkit.git',
        branch: 'master',
        pathList: 'docker,scripts',
        assistantVersions: ['v2.1.0'],
        creator: 'a00559878',
        nameCn: '王五',
        createTime: '2026-03-12 10:10:00',
        taskStatus: TASK_STATUS.NOT_STARTED,
        codeLanguage: 'Shell',
        lineNum: 0.4,
        productName: 'CloudNative',
        s3Path: 's3://ai-repo-scan/results/T01020304-0506-0708-090a-0b0c0d0e0f05',
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
        scanResults: []
    },
    'T01020304-0506-0708-090a-0b0c0d0e0f07': {
        taskId: 'T01020304-0506-0708-090a-0b0c0d0e0f07',
        taskName: '批处理作业调度扫描',
        repoUrl: 'https://codehub.huawei.com/Batch/Scheduler/job-runner.git',
        branch: 'develop',
        pathList: 'jobs,scheduler',
        assistantVersions: ['v1.1.0'],
        creator: 'a00559876',
        nameCn: '张三',
        createTime: '2026-03-10 08:00:00',
        taskStatus: TASK_STATUS.NOT_STARTED,
        codeLanguage: 'Python',
        lineNum: 0.9,
        productName: 'Batch',
        s3Path: 's3://ai-repo-scan/results/T01020304-0506-0708-090a-0b0c0d0e0f07',
        scanResults: []
    }
}

// 存储标注数据（按任务ID和warn_uuid存储）
const annotationsData: Record<string, Record<string, AnnotationData>> = {
    'T00112233-4455-6677-8899-aabbccddeeff': {
        // 需要修改 (0)
        'w00112233-4455-6677-8899-aabbccddeeff': {
            issue_result: 0,
            annotator: 'a00559876',
            annotationTime: '2024-01-15 14:30:25'
        },
        // 无需修改的问题 (1)
        'w11223344-5566-7788-99aa-bbccddeeff00': {
            issue_result: 1,
            annotator: 'a00559877',
            annotationTime: '2024-01-15 15:20:10'
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

// Mock 扫描结果数据
const mockScanResults: Record<string, (Omit<ScanResult, 'issue_result' | 'annotator' | 'annotationTime' | 'reason'> & { annotation?: Annotation | null })[]> = {
    'T00112233-4455-6677-8899-aabbccddeeff': [{
            warn_uuid: 'w00112233-4455-6677-8899-aabbccddeeff',
            file_name: 'UserProfile.vue',
            rule_name: '不安全函数使用',
            warn_line: 45,
            warn_code_block: 'const result = eval(userInput);',
            code_snippet: 'const result = eval(userInput);',
            context: 'function processUserInput(userInput) {\n  // 处理用户输入\n  const result = eval(userInput);\n  return result;\n}',
            warn: '使用了不安全的eval函数，可能导致代码注入攻击。建议使用JSON.parse()或其他安全的解析方法。',
            check_function_id: 'func-001',
            confidence: '85%',
            start_line: 40,
            end_line: 50,
            func_uuid: 'func-uuid-001',
            index: 1
        },
        {
            warn_uuid: 'w11223344-5566-7788-99aa-bbccddeeff00',
            file_name: 'api.js',
            rule_name: 'DOM操作性能问题',
            warn_line: 128,
            warn_code_block: 'document.getElementById("list").innerHTML += item;',
            code_snippet: 'document.getElementById("list").innerHTML += item;',
            context: 'for (let i = 0; i < items.length; i++) {\n  const item = items[i];\n  document.getElementById("list").innerHTML += item;\n}',
            warn: '在循环中进行了DOM操作，可能导致性能瓶颈。建议先构建完整的HTML字符串，然后一次性更新DOM。',
            check_function_id: 'func-002',
            confidence: '90%',
            start_line: 125,
            end_line: 132,
            func_uuid: 'func-uuid-002',
            index: 2
        },
        {
            warn_uuid: 'w22334455-6677-8899-aabb-ccddeeff0011',
            file_name: 'user.js',
            rule_name: '命名规范问题',
            warn_line: 67,
            warn_code_block: 'let user_name = "test";',
            code_snippet: 'let user_name = "test";',
            context: 'function getUserInfo() {\n  let user_name = "test";\n  let user_age = 25;\n  return { user_name, user_age };\n}',
            warn: '变量命名不符合规范，建议使用驼峰命名（camelCase）。应改为userName。',
            check_function_id: 'func-003',
            confidence: '75%',
            start_line: 65,
            end_line: 70,
            func_uuid: 'func-uuid-003',
            index: 3
        },
        {
            warn_uuid: 'w33445566-7788-99aa-bbcc-ccddeeff0011',
            file_name: 'HomePage.vue',
            rule_name: 'XSS安全漏洞',
            warn_line: 203,
            warn_code_block: '<div v-html="userContent"></div>',
            code_snippet: '<div v-html="userContent"></div>',
            context: '<template>\n  <div class="home-page">\n    <div v-html="userContent"></div>\n  </div>\n</template>',
            warn: '未对用户输入进行XSS防护处理，直接使用v-html可能导致XSS攻击。建议对用户输入进行转义处理或使用安全的渲染方法。',
            check_function_id: 'func-004',
            confidence: '95%',
            start_line: 200,
            end_line: 206,
            func_uuid: 'func-uuid-004',
            index: 4
        },
        {
            warn_uuid: 'w44556677-8899-aabb-bbcc-ccddeeff0011',
            file_name: 'request.js',
            rule_name: '缺少错误处理',
            warn_line: 89,
            warn_code_block: 'return data.items[0].name;',
            code_snippet: 'return data.items[0].name;',
            context: 'function getFirstItemName(response) {\n  const data = response.data;\n  return data.items[0].name;\n}',
            warn: '缺少错误处理机制，如果data或items为空或undefined，可能导致程序崩溃。建议添加空值检查和错误处理。',
            check_function_id: 'func-005',
            confidence: '80%',
            start_line: 87,
            end_line: 91,
            func_uuid: 'func-uuid-005',
            index: 5
        },
        {
            warn_uuid: 'w55667788-99aa-aabb-bbcc-ccddeeff0011',
            file_name: 'DataTable.vue',
            rule_name: '大数据渲染性能问题',
            warn_line: 156,
            warn_code_block: '<div v-for="item in largeList" :key="item.id">',
            code_snippet: '<div v-for="item in largeList" :key="item.id">',
            context: '<template>\n  <div class="data-table">\n    <div v-for="item in largeList" :key="item.id">\n      {{ item.name }}\n    </div>\n  </div>\n</template>',
            warn: '大量数据未使用虚拟滚动，可能导致页面卡顿。建议使用虚拟滚动组件（如el-virtual-list）来优化性能。',
            check_function_id: 'func-006',
            confidence: '88%',
            start_line: 154,
            end_line: 159,
            func_uuid: 'func-uuid-006',
            index: 6
        },
        {
            warn_uuid: 'w66778899-aabb-bbcc-ccdd-ccddeeff0011',
            file_name: 'validator.js',
            rule_name: '函数过长',
            warn_line: 34,
            warn_code_block: 'function validateForm(form) {',
            code_snippet: 'function validateForm(form) {',
            context: 'function validateForm(form) {\n  // 验证用户名\n  // 验证密码\n  // 验证邮箱\n  // ... 200行代码\n  return isValid;\n}',
            warn: '函数过长，建议拆分为多个小函数，提高代码可读性和可维护性。',
            check_function_id: 'func-007',
            confidence: '70%',
            start_line: 34,
            end_line: 234,
            func_uuid: 'func-uuid-007',
            index: 7
        },
        {
            warn_uuid: 'w5427cb40-aa79-4f99-aabd-f77da06222a9',
            file_name: 'sdc/domain/libcompiler/adr_compile.c',
            rule_name: '内存安全',
            warn_line: 51,
            warn_code_block: ';',
            code_snippet: '',
            context: '',
            warn: '内存分配后没有检查分配的大小是否足够后续操作，可能导致缓冲区溢出。应确保分配的内存大小足够容纳所有操作。',
            check_function_id: null,
            confidence: '0',
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
    ],
    'T11223344-5566-7788-99aa-bbccddeeff00': [],
    'T22334455-6677-8899-aabb-ccddeeff0011': [],
    'T01020304-0506-0708-090a-0b0c0d0e0f01': [],
    'T01020304-0506-0708-090a-0b0c0d0e0f02': [],
    'T01020304-0506-0708-090a-0b0c0d0e0f03': [],
    'T01020304-0506-0708-090a-0b0c0d0e0f04': [],
    'T01020304-0506-0708-090a-0b0c0d0e0f05': [],
    'T01020304-0506-0708-090a-0b0c0d0e0f06': [],
    'T01020304-0506-0708-090a-0b0c0d0e0f07': []
}

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
            mockTaskDetails[id] = detail
            const sr = raw.scanResults
            if (Array.isArray(sr) && sr.length > 0) {
                mockScanResults[id] = sr as ScanResult[]
            } else {
                mockScanResults[id] = []
            }
        }
    } catch (e) {
        console.error('加载任务列表失败:', e)
    }
}

hydrateTasksFromStorage()

/** 演示任务「前端代码扫描」补充更多扫描结果行，便于详情页分页调试（本地 mock 且存在该任务时生效） */
;(function appendExtraMockScanResultsForDemoTask(): void {
    const tid = 'T00112233-4455-6677-8899-aabbccddeeff'
    const list = mockScanResults[tid] as unknown[] | undefined
    if (!list) return
    /** 与详情页展示上限一致，避免 mock 条数过多 */
    const targetMax = 20
    if (list.length >= targetMax) return
    const rules = [
        'SQL注入风险',
        '硬编码密钥',
        '弱随机数',
        '资源未释放',
        '并发竞态',
        '日志敏感信息',
        '明文传输',
        'CORS配置不当',
        '未校验重定向',
        '依赖版本过旧',
        '敏感数据落盘',
        'HTTPS未启用',
        '证书校验关闭',
        '过于宽松的正则'
    ]
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
        list.push({
            warn_uuid: `w-extra-${String(idx).padStart(2, '0')}-aaaa-bbbb-cccc-${String(100000 + idx).padStart(12, '0')}`,
            file_name: files[(idx - 1) % files.length],
            rule_name: rules[(idx - 1) % rules.length],
            warn_line: 20 + i * 3,
            warn_code_block: '// TODO: review',
            code_snippet: '// example',
            context: 'function example() {\n  // ...\n}',
            warn: `Mock 扫描问题 #${idx}：用于分页演示，请检查相关代码路径与配置。`,
            check_function_id: `func-extra-${idx}`,
            confidence: `${60 + (i % 35)}%`,
            start_line: 18 + i * 3,
            end_line: 24 + i * 3,
            func_uuid: `func-extra-uuid-${idx}`,
            index: idx
        })
    }
})()

// 获取任务的标注数据
const getAnnotationsForTask = (taskId: string): Record<string, AnnotationData> => {
    return annotationsData[taskId] || {}
}

/**
 * 查询任务列表（带过滤），与 GET `/api/tasks` 一致
 * @param pageNum 必填，当前页码（从 1 起）
 * @param pageSize 必填，每页条数
 * @param creator 可选，创建人筛选
 * @param taskStatus 可选，任务状态筛选
 * @param taskName 可选，任务名称模糊筛选
 */
export const queryTaskList = async (
    pageNum: number,
    pageSize: number,
    creator?: string,
    taskStatus?: string,
    taskName?: string
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
        scanResults: []
    }
    mockTaskDetails[taskId] = task
    mockScanResults[taskId] = []
    persistTasksToStorage()
    return envelopeOk(task)
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
                success: true,
                message: '上传成功',
                number: 200,
            },
            data: path,
        },
    }
}

/**
 * 任务详情 scanResults 按标注状态筛选（与 GET `/api/tasks/{taskId}` 的 query 一致）
 * - 空字符串：不过滤
 * - `unmarked`：仅未标注（issue_result 为 null）
 * - `0` / `1` / `2`：对应已标注结果
 */
export type TaskDetailAnnotationStatusFilter = '' | 'unmarked' | '0' | '1' | '2'

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

// ---------------------------------------------------------------------------
// 与接口文档 1.2.1 / 1.2.2 一致的 HTTP 响应形（meta.success + data），供本地模拟
// ---------------------------------------------------------------------------

/** 接口文档 1.2.x 成功/失败时的 meta 形态 */
export interface ApiDocHttpMeta {
    success: boolean
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

function metaDocOk(): ApiDocHttpMeta {
    return { success: true, message: 'OK', number: 200 }
}

function metaDocFail(number: number, message: string): ApiDocHttpMeta {
    return { success: false, message, number }
}

function scanResultToApiDocRow(r: ScanResult, selfIncrementId: number): TaskScanResultApiDocRow {
    const confRaw = r.confidence
    const confidence =
        typeof confRaw === 'number'
            ? confRaw
            : Number.parseFloat(String(confRaw ?? '0').replace(/%/g, '')) || 0
    let annotation: TaskScanResultAnnotationApiDoc | null = null
    if (r.annotation) {
        const a = r.annotation
        annotation = {
            id: a.id,
            warnUuid: a.warnUuid,
            userId: a.userId,
            issueResult: a.issueResult,
            reason: a.reason,
            annotationStatus: a.annotationStatus,
            createTime: a.createTime,
            updateTime: a.updateTime,
            userName: a.userName,
            userDepartment: a.userDepartment,
            taskId: a.taskId,
        }
    }
    return {
        file_name: r.file_name,
        function_name: '',
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
        warnCount: warnN,
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
): Promise<TaskScanResultsApiDocResponse> {
    await new Promise((r) => setTimeout(r, 0))
    const taskDetail = mockTaskDetails[taskId]
    if (!taskDetail) {
        return { meta: metaDocFail(404, '未找到任务'), data: null }
    }
    if (taskDetail.taskStatus !== TASK_STATUS.COMPLETED) {
        const ps = Math.max(1, pageSize || 10)
        return {
            meta: metaDocOk(),
            data: {
                scanResults: [],
                paginationInfo: {
                    totalPages: 1,
                    pageSize: ps,
                    hasPrevious: false,
                    hasNext: false,
                    currentPage: 1,
                    totalCount: 0,
                },
            },
        }
    }

    const results = mockScanResults[taskId] || []
    const annotations = getAnnotationsForTask(taskId)
    let scanResults: ScanResult[] = results.map((r: any, idx: number) => {
        const uuid = r.warn_uuid || r.id || `warn-${idx}`
        const ann = annotations[uuid]
        return {
            warn_uuid: uuid,
            file_name: r.file_name || r.fileName || '',
            rule_name: r.rule_name || '',
            warn_line: r.warn_line || r.line || 0,
            warn_code_block: r.warn_code_block || r.code_block || '',
            code_snippet: r.code_snippet || r.warn_code_block || r.code_block || '',
            context: r.context || '',
            warn: r.warn || '',
            check_function_id: r.check_function_id !== undefined ? r.check_function_id : null,
            confidence: r.confidence || '0%',
            start_line: r.start_line || r.warn_line || r.line || 0,
            end_line: r.end_line || r.warn_line || r.line || 0,
            func_uuid: r.func_uuid || '',
            index: r.index !== undefined ? r.index : idx + 1,
            reason: ann?.reason || r.reason || null,
            issue_result: ann ? ann.issue_result : (r.issue_result !== undefined ? r.issue_result : null),
            annotator: ann?.annotator || r.annotator,
            annotationTime: ann?.annotationTime || r.annotationTime,
            annotation: r.annotation || null,
        } as ScanResult
    })

    const annFilter = annotation == null ? '' : String(annotation).trim()
    scanResults = filterScanResultsByAnnotationStatus(scanResults, annFilter)
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
        scanResults = results.map((r: any, idx: number) => {
            const uuid = r.warn_uuid || r.id || `warn-${idx}`
            const annotation = annotations[uuid]
            
            return {
                warn_uuid: uuid,
                file_name: r.file_name || r.fileName || '',
                rule_name: r.rule_name || '',
                warn_line: r.warn_line || r.line || 0,
                warn_code_block: r.warn_code_block || r.code_block || '',
                code_snippet: r.code_snippet || r.warn_code_block || r.code_block || '',
                context: r.context || '',
                warn: r.warn || '',
                check_function_id: r.check_function_id !== undefined ? r.check_function_id : null,
                confidence: r.confidence || '0%',
                start_line: r.start_line || r.warn_line || r.line || 0,
                end_line: r.end_line || r.warn_line || r.line || 0,
                func_uuid: r.func_uuid || '',
                index: r.index !== undefined ? r.index : idx + 1,
                reason: annotation?.reason || r.reason || null,
                issue_result: annotation ? annotation.issue_result : (r.issue_result !== undefined ? r.issue_result : null),
                annotator: annotation?.annotator || r.annotator,
                annotationTime: annotation?.annotationTime || r.annotationTime,
                annotation: r.annotation || null // 保留原始annotation字段
            }
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
    const resultsWithAnnotations: ScanResult[] = results.map(result => {
        const warnUuid = result.warn_uuid
        if (annotations[warnUuid]) {
            return {
                ...result,
                issue_result: annotations[warnUuid].issue_result,
                reason: annotations[warnUuid].reason || null,
                annotator: annotations[warnUuid].annotator,
                annotationTime: annotations[warnUuid].annotationTime
            } as ScanResult
        }
        return {
            ...result,
            reason: null,
            issue_result: null,
            annotator: undefined,
            annotationTime: undefined
        } as ScanResult
    })

    return envelopeOk(resultsWithAnnotations)
}

let mockSaveAnnotationIdSeq = 1

function formatAnnotationResponseTime(d: Date = new Date()): string {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
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

    // 初始化任务标注数据
    if (!annotationsData[taskId]) {
        annotationsData[taskId] = {}
    }

    if (issueResult === null) {
        // 取消标注，删除记录
        delete annotationsData[taskId][warnUuid]
        return envelopeOk(null)
    }

    const now = formatAnnotationResponseTime()
    const data: SaveAnnotationResultData = {
        id: mockSaveAnnotationIdSeq++,
        warnUuid,
        userId,
        issueResult,
        reason: reqBody.reason ?? '',
        annotationStatus: 1,
        createTime: now,
        updateTime: now,
        userName: reqBody.userName?.trim() ? reqBody.userName.trim() : null,
        userDepartment: null,
        taskId
    }

    // 保存标注（内存 mock 仍用 annotator 字段承载 userId）
    annotationsData[taskId][warnUuid] = {
        issue_result: issueResult,
        annotator: userId,
        annotationTime: data.updateTime,
        ...(reqBody.reason !== undefined ? { reason: reqBody.reason } : {})
    }

    return envelopeOk(data)
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
    const statusDescriptions: Record<number, string> = {
        0: '需要修改',
        1: '无需修改的问题',
        2: '问题误报'
    }

    // 统计已标注的总数（用于计算百分比）
    const totalAnnotated = annotatedCount

    // 添加已标注状态（汇总所有标注结果）
    if (totalAnnotated > 0) {
        statusDistribution.push({
            statusCode: 1, // 1 表示已标注
            statusDescription: '已标注',
            warnCount: totalAnnotated,
            percentage: 100.0
        })
    }

    // 添加各个标注结果的状态分布
    Object.entries(statusCountMap).forEach(([code, count]) => {
        if (count > 0) {
            const statusCode = parseInt(code, 10)
            const percentage = totalAnnotated > 0 
                ? Number(((count / totalAnnotated) * 100).toFixed(2))
                : 0
            statusDistribution.push({
                statusCode: statusCode,
                statusDescription: statusDescriptions[statusCode] || '未知状态',
                warnCount: count,
                percentage: percentage
            })
        }
    })

    const statistics: AnnotationStatistics = {
        taskId: taskDetail.taskId,
        taskName: taskDetail.taskName,
        totalWarnCount: totalWarnCount,
        annotatedCount: annotatedCount,
        unannotatedCount: unannotatedCount,
        annotationCompletionRate: annotationCompletionRate,
        statusDistribution: statusDistribution
    }

    return envelopeOk(statistics)
}