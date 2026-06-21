import * as XLSX from 'xlsx'
import { isValidRepoGitUrl } from '@/views/taskManagement/utils/taskFormValidation'
import type { BatchCreateTaskItem } from '@/api/types'

export const DEFAULT_BATCH_CODE_LANGUAGE = 'C/C++'
export const DEFAULT_BATCH_ASSISTANT_VERSION = '内存安全v1.0.0'
export const BATCH_TASK_MAX_ROWS = 100

/** 模板列：表头中文名 -> 字段 key */
export const BATCH_TASK_TEMPLATE_COLUMNS: ReadonlyArray<{
    key: keyof BatchCreateTaskItem
    header: string
    required?: boolean
    hint?: string
}> = [
    { key: 'taskName', header: '任务名称', required: true },
    { key: 'repoUrl', header: '代码仓Git地址', required: true, hint: 'HTTPS 克隆地址，如 https://host/org/repo.git' },
    { key: 'branch', header: '扫描分支', required: true },
    { key: 'pathList', header: '扫描路径', hint: '可选，多个路径英文逗号分隔' },
    { key: 'codeLanguage', header: '代码语言', hint: `默认 ${DEFAULT_BATCH_CODE_LANGUAGE}` },
    { key: 'productName', header: '产品名称', required: true },
    { key: 'deptName', header: '部门名称' },
    { key: 'pduName', header: 'PDU名称' },
    { key: 'hostUrl', header: '本机启动URL', hint: '可选，启动扫描前必填' },
    { key: 'modelName', header: '模型名称', hint: '可选，启动扫描前必填' },
]

const HEADER_TO_KEY = new Map(
    BATCH_TASK_TEMPLATE_COLUMNS.flatMap((col) => [
        [col.header, col.key],
        [String(col.key), col.key],
    ]),
)

export interface ParsedBatchTaskRow {
    rowIndex: number
    data: BatchCreateTaskItem
    errors: string[]
}

function cellToString(value: unknown): string {
    if (value == null) return ''
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value)
    }
    return String(value).trim()
}

function normalizeRow(raw: Record<string, unknown>, rowIndex: number): ParsedBatchTaskRow {
    const data: BatchCreateTaskItem = {
        taskName: '',
        productName: '',
        repoUrl: '',
        branch: '',
    }

    for (const col of BATCH_TASK_TEMPLATE_COLUMNS) {
        const rawVal = raw[col.key] ?? raw[col.header]
        const str = cellToString(rawVal)
        if (col.key === 'lineNum') {
            if (str !== '') {
                const n = Number(str)
                if (!Number.isFinite(n) || n < 0) {
                    data.lineNum = undefined
                } else {
                    data.lineNum = n
                }
            }
        } else {
            ;(data as unknown as Record<string, unknown>)[col.key] = str
        }
    }

    if (!data.codeLanguage) data.codeLanguage = DEFAULT_BATCH_CODE_LANGUAGE
    if (!data.assistantVersions) data.assistantVersions = DEFAULT_BATCH_ASSISTANT_VERSION

    return {
        rowIndex,
        data,
        errors: validateBatchTaskRow(data),
    }
}

function validateTaskName(name: string | null | undefined): string[] {
    const errors: string[] = []
    const taskName = (name || '').trim()
    if (!taskName) {
        errors.push('任务名称不能为空')
    } else if (taskName.length < 2 || taskName.length > 50) {
        errors.push('任务名称长度需在 2 到 50 个字符')
    }
    return errors
}

function validateRepoUrl(url: string | null | undefined): string[] {
    const errors: string[] = []
    const repoUrl = (url || '').trim()
    if (!repoUrl) {
        errors.push('代码仓Git地址不能为空')
    } else if (!isValidRepoGitUrl(repoUrl)) {
        errors.push('代码仓Git地址格式无效')
    }
    return errors
}

function validateBranch(branch: string | null | undefined): string[] {
    const errors: string[] = []
    if (!(branch || '').trim()) {
        errors.push('扫描分支不能为空')
    }
    return errors
}

function validatePathList(pathList: string | null | undefined): string[] {
    const errors: string[] = []
    const pathListStr = (pathList || '').trim()
    if (pathListStr) {
        const paths = pathListStr.split(',').map((p) => p.trim()).filter(Boolean)
        if (paths.length === 0) {
            errors.push('扫描路径格式无效')
        }
    }
    return errors
}

function validateProductName(productName: string | null | undefined): string[] {
    const errors: string[] = []
    if (!(productName || '').trim()) {
        errors.push('产品名称不能为空')
    }
    return errors
}

function validateLineNum(lineNum: number | null | undefined): string[] {
    const errors: string[] = []
    const lineStr = lineNum != null ? String(lineNum) : ''
    if (lineStr !== '' && (lineNum == null || !Number.isFinite(lineNum) || lineNum < 0)) {
        errors.push('代码量(k)须为非负数字')
    }
    return errors
}

function validateHostUrlAndModelName(
    hostUrl: string | null | undefined,
    modelName: string | null | undefined,
): string[] {
    const errors: string[] = []
    const hostUrlStr = (hostUrl || '').trim()
    const modelNameStr = (modelName || '').trim()
    if (hostUrlStr && !/^https?:\/\/.+/i.test(hostUrlStr)) {
        errors.push('本机启动URL格式无效')
    }
    return errors
}

function concatErrors(errors: string[], newErrors: string[]): string[] {
    return errors.concat(newErrors)
}

export function validateBatchTaskRow(row: BatchCreateTaskItem): string[] {
    let errors: string[] = []
    errors = concatErrors(errors, validateTaskName(row.taskName))
    errors = concatErrors(errors, validateRepoUrl(row.repoUrl))
    errors = concatErrors(errors, validateBranch(row.branch))
    errors = concatErrors(errors, validatePathList(row.pathList))
    errors = concatErrors(errors, validateProductName(row.productName))
    errors = concatErrors(errors, validateLineNum(row.lineNum))
    errors = concatErrors(errors, validateHostUrlAndModelName(row.hostUrl, row.modelName))
    return errors
}

function isEmptyDataRow(row: BatchCreateTaskItem): boolean {
    return BATCH_TASK_TEMPLATE_COLUMNS.every((col) => {
        const v = row[col.key]
        if (v == null) return true
        return String(v).trim() === ''
    })
}

function mapHeaderRow(headers: string[]): Record<number, keyof BatchCreateTaskItem> {
    const map: Record<number, keyof BatchCreateTaskItem> = {}
    headers.forEach((h, idx) => {
        const key = HEADER_TO_KEY.get(String(h ?? '').trim())
        if (key) map[idx] = key
    })
    return map
}

function parseSheetToMatrix(sheet: XLSX.WorkSheet): (string | number | null)[][] {
    return XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
        header: 1,
        defval: '',
        raw: false,
    })
}

function validateHeaderRow(
    headerRow: (string | number | null)[] | undefined,
): asserts headerRow is (string | number | null)[] {
    if (!headerRow) {
        throw new Error('文件中没有数据行，请至少填写一行任务')
    }
}

function validateColMap(colMap: Record<string, string>): void {
    if (Object.keys(colMap).length === 0) {
        throw new Error('未识别到有效表头，请使用系统提供的导入模板')
    }
}

function validateRequiredColumns(headerCells: string[]): void {
    const requiredHeaders = BATCH_TASK_TEMPLATE_COLUMNS
        .filter((c) => c.required)
        .map((c) => c.header)
    const missing = requiredHeaders.filter(
        (h) => !headerCells.some((cell) => cell === h),
    )
    if (missing.length > 0) {
        throw new Error(`缺少必填列：${missing.join('、')}`)
    }
}

function validateRowCount(rows: ParsedBatchTaskRow[]): void {
    if (rows.length === 0) {
        throw new Error('未解析到有效任务行')
    }
    if (rows.length > BATCH_TASK_MAX_ROWS) {
        throw new Error(`单次最多导入 ${BATCH_TASK_MAX_ROWS} 条任务，当前 ${rows.length} 条`)
    }
}

function buildColMap(matrix: (string | number | null)[][], colMap: Record<string, string>): ParsedBatchTaskRow[] {
    const rows: ParsedBatchTaskRow[] = []
    for (let i = 1; i < matrix.length; i++) {
        const line = matrix[i]
        if (!line || line.every((c) => cellToString(c) === '')) continue

        const raw: Record<string, unknown> = {}
        for (const [colIdx, key] of Object.entries(colMap)) {
            raw[key] = line[Number(colIdx)] ?? ''
        }
        const parsed = normalizeRow(raw, i)
        if (isEmptyDataRow(parsed.data)) continue
        rows.push(parsed)
    }
    return rows
}

/** 解析上传的 Excel / CSV 文件 */
export async function parseBatchTaskFile(file: File): Promise<ParsedBatchTaskRow[]> {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
        throw new Error('文件中没有可用的工作表')
    }
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) {
        throw new Error('文件中没有可用的工作表')
    }

    const matrix = parseSheetToMatrix(sheet)
    if (matrix.length < 2) {
        throw new Error('文件中没有数据行，请至少填写一行任务')
    }

    const headerRow = matrix[0]
    validateHeaderRow(headerRow)

    const headerCells = headerRow.map((c) => cellToString(c))
    const colMap = mapHeaderRow(headerCells)
    validateColMap(colMap)
    validateRequiredColumns(headerCells)

    const rows = buildColMap(matrix, colMap)
    validateRowCount(rows)

    return rows
}

/** 下载批量创建 Excel 模板 */
export function downloadBatchTaskTemplate(): void {
    const headers = BATCH_TASK_TEMPLATE_COLUMNS.map((c) => c.header)
    const exampleRow = [
        '示例任务',
        'https://gitee.com/example/repo.git',
        'main',
        'src,utils',
        DEFAULT_BATCH_CODE_LANGUAGE,
        '示例产品',
        '示例部门',
        '示例PDU',
        '',
        '',
    ]
    const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow])
    ws['!cols'] = BATCH_TASK_TEMPLATE_COLUMNS.map((col) => ({
        wch: Math.max(col.header.length + 4, 18),
    }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '任务导入')
    XLSX.writeFile(wb, '任务批量创建模板.xlsx')
}

/** 将解析结果转为 API 请求体中的 tasks 数组 */
export function toBatchCreateItems(rows: ParsedBatchTaskRow[]): BatchCreateTaskItem[] {
    return rows.map(({ data }) => {
        const item: BatchCreateTaskItem = {
            taskName: data.taskName.trim(),
            productName: data.productName.trim(),
            repoUrl: data.repoUrl.trim(),
            branch: data.branch.trim(),
            assistantVersions: (data.assistantVersions || DEFAULT_BATCH_ASSISTANT_VERSION).trim(),
            codeLanguage: (data.codeLanguage || DEFAULT_BATCH_CODE_LANGUAGE).trim(),
        }
        const pathList = (data.pathList || '').trim()
        if (pathList) item.pathList = pathList
        const deptName = (data.deptName || '').trim()
        if (deptName) item.deptName = deptName
        const pduName = (data.pduName || '').trim()
        if (pduName) item.pduName = pduName
        if (data.lineNum != null && Number.isFinite(data.lineNum)) item.lineNum = data.lineNum
        const hostUrl = (data.hostUrl || '').trim()
        const modelName = (data.modelName || '').trim()
        if (hostUrl) item.hostUrl = hostUrl
        if (modelName) item.modelName = modelName
        return item
    })
}