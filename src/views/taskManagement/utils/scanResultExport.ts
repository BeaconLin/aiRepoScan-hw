import * as XLSX from 'xlsx'
import { getTaskScanResults } from '@/api/taskManagementApi'
import type { TaskScanResultApiDocRow } from '@/api/types/taskApiDoc'
import type { TaskDetail } from '@/api/types/taskModel'

/** 单次分页拉取条数（导出专用，减少请求次数） */
export const SCAN_RESULT_EXPORT_PAGE_SIZE = 200

/** 导出筛选条件（与任务详情页 filterForm 对齐） */
export interface ScanResultExportFilter {
    ruleName?: string
    /** `unmarked` / `0` / `1` / `2` */
    annotation?: string
    /** `0` / `1` / `2` */
    reviewStatus?: string
    /** 客户端关键词（文件路径、规则名、问题说明等） */
    keyword?: string
}

export interface ScanResultExportOptions {
    taskId: string
    taskInfo: Pick<
        TaskDetail,
        | 'taskId'
        | 'taskName'
        | 'repoUrl'
        | 'branch'
        | 'pathList'
        | 'creator'
        | 'nameCn'
        | 'createTime'
        | 'productName'
        | 'codeLanguage'
        | 'lineNum'
    >
    filter?: ScanResultExportFilter
    /** 是否在 Excel 中包含评审相关列 */
    includeReviewColumns?: boolean
    onProgress?: (loaded: number, total: number) => void
}

interface ExportColumn {
    header: string
    getValue: (row: TaskScanResultApiDocRow) => string | number
}

export function formatIssueResultLabel(issueResult: number | null | undefined): string {
    if (issueResult === 0) {
        return '需要修改'
    }
    if (issueResult === 1) {
        return '无需修改的问题'
    }
    if (issueResult === 2) {
        return '问题误报'
    }
    return '未标注'
}

export function formatReviewStatusLabel(status: number | null | undefined): string {
    if (status === 1) {
        return '已通过'
    }
    if (status === 2) {
        return '已驳回'
    }
    if (status === 0) {
        return '未评审'
    }
    return ''
}

function cellString(value: unknown): string {
    if (value == null) {
        return ''
    }
    return String(value)
}

function sanitizeFileNameSegment(name: string): string {
    return name.replace(/[\\/:*?"<>|]/g, '_').trim().slice(0, 80) || '任务'
}

function formatTimestampForFileName(date = new Date()): string {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
}

function matchesKeyword(row: TaskScanResultApiDocRow, keyword: string): boolean {
    const kw = keyword.toLowerCase()
    const fields = [
        row.file_name,
        row.rule_name,
        row.warn,
        row.function_name,
        row.warn_code_block,
        row.code_snippet,
        row.context,
        row.reason,
        row.warn_uuid,
    ]
    return fields.some((f) => cellString(f).toLowerCase().includes(kw))
}

function buildExportColumns(includeReviewColumns: boolean): ExportColumn[] {
    const base: ExportColumn[] = [
        { header: '序号', getValue: (r) => r.self_increment_id ?? '' },
        { header: '告警ID', getValue: (r) => r.warn_uuid },
        { header: '文件路径', getValue: (r) => r.file_name },
        { header: '函数名', getValue: (r) => r.function_name ?? '' },
        { header: '规则名称', getValue: (r) => r.rule_name },
        { header: '告警行号', getValue: (r) => r.warn_line },
        { header: '起始行', getValue: (r) => r.start_line },
        { header: '结束行', getValue: (r) => r.end_line },
        { header: '问题说明', getValue: (r) => r.warn },
        { header: '问题代码', getValue: (r) => r.warn_code_block },
        { header: '切片代码', getValue: (r) => r.code_snippet },
        { header: '修改建议', getValue: (r) => r.context },
        { header: '发生条件与影响', getValue: (r) => r.reason ?? '' },
        { header: '置信度', getValue: (r) => cellString(r.confidence) },
        { header: '函数UUID', getValue: (r) => r.func_uuid },
        {
            header: '标注结论',
            getValue: (r) =>
                r.annotation?.annotationStatus
                    ? formatIssueResultLabel(r.annotation.issueResult)
                    : '未标注',
        },
        { header: '标注原因', getValue: (r) => r.annotation?.reason ?? '' },
        { header: '标注人工号', getValue: (r) => r.annotation?.userId ?? '' },
        { header: '标注人姓名', getValue: (r) => r.annotation?.userName ?? '' },
        { header: '标注人部门', getValue: (r) => r.annotation?.userDepartment ?? '' },
        {
            header: '标注时间',
            getValue: (r) => r.annotation?.updateTime ?? r.annotation?.createTime ?? '',
        },
    ]

    if (!includeReviewColumns) {
        return base
    }

    return [
        ...base,
        {
            header: '评审状态',
            getValue: (r) =>
                r.annotation?.annotationStatus
                    ? formatReviewStatusLabel(r.annotation.reviewStatus ?? 0)
                    : '',
        },
        { header: '评审人工号', getValue: (r) => r.annotation?.reviewerUserId ?? '' },
        { header: '评审人姓名', getValue: (r) => r.annotation?.reviewerUserName ?? '' },
        { header: '评审时间', getValue: (r) => r.annotation?.reviewTime ?? '' },
        { header: '评审意见', getValue: (r) => r.annotation?.reviewComment ?? '' },
        {
            header: '最终结论',
            getValue: (r) =>
                r.annotation?.finalIssueResult != null
                    ? formatIssueResultLabel(r.annotation.finalIssueResult)
                    : '',
        },
    ]
}

function buildTaskInfoSheetRows(
    taskInfo: ScanResultExportOptions['taskInfo'],
    filter: ScanResultExportFilter | undefined,
    exportedCount: number,
): string[][] {
    const creatorDisplay = [taskInfo.creator, taskInfo.nameCn].filter(Boolean).join(' ')
    const filterDesc: string[] = []
    if (filter?.ruleName?.trim()) {
        filterDesc.push(`规则=${filter.ruleName.trim()}`)
    }
    if (filter?.annotation?.trim()) {
        const map: Record<string, string> = {
            unmarked: '未标注',
            '0': '需要修改',
            '1': '无需修改的问题',
            '2': '问题误报',
        }
        filterDesc.push(`标注=${map[filter.annotation.trim()] ?? filter.annotation}`)
    }
    if (filter?.reviewStatus?.trim()) {
        filterDesc.push(`评审=${formatReviewStatusLabel(Number(filter.reviewStatus))}`)
    }
    if (filter?.keyword?.trim()) {
        filterDesc.push(`关键词=${filter.keyword.trim()}`)
    }

    return [
        ['字段', '值'],
        ['任务ID', taskInfo.taskId],
        ['任务名称', taskInfo.taskName],
        ['代码仓地址', taskInfo.repoUrl],
        ['扫描分支', taskInfo.branch],
        ['扫描路径', taskInfo.pathList || ''],
        ['产品名称', taskInfo.productName],
        ['代码语言', taskInfo.codeLanguage],
        ['代码量(k)', String(taskInfo.lineNum ?? '')],
        ['创建人', creatorDisplay],
        ['创建时间', taskInfo.createTime],
        ['导出条数', String(exportedCount)],
        ['导出筛选', filterDesc.length > 0 ? filterDesc.join('；') : '全部'],
        ['导出时间', new Date().toLocaleString('zh-CN', { hour12: false })],
    ]
}

/** 分页拉取任务下全部扫描结果（可带服务端筛选） */
export async function fetchAllScanResultsForExport(
    taskId: string,
    filter: ScanResultExportFilter = {},
    onProgress?: (loaded: number, total: number) => void,
): Promise<TaskScanResultApiDocRow[]> {
    const all: TaskScanResultApiDocRow[] = []
    let pageNum = 1
    let totalCount = 0

    const ruleName = filter.ruleName?.trim() || undefined
    const annotation = filter.annotation?.trim() || undefined
    const reviewStatus = filter.reviewStatus?.trim() || undefined

    while (true) {
        const res = await getTaskScanResults(
            taskId,
            pageNum,
            SCAN_RESULT_EXPORT_PAGE_SIZE,
            ruleName,
            annotation,
            reviewStatus,
        )
        if (!res.meta.isSuccess || !res.data) {
            throw new Error(res.meta.message || '获取扫描结果失败')
        }

        const rows = res.data.scanResults ?? []
        const pi = res.data.paginationInfo
        if (pageNum === 1) {
            totalCount = pi?.totalCount ?? rows.length
        }

        all.push(...rows)
        onProgress?.(all.length, totalCount)

        const hasNext = pi?.hasNext === true
        if (!hasNext || rows.length === 0) {
            break
        }
        pageNum += 1
    }

    const keyword = filter.keyword?.trim()
    if (keyword) {
        return all.filter((row) => matchesKeyword(row, keyword))
    }
    return all
}

/** 将扫描结果导出为 Excel 文件（客户端生成） */
export async function exportScanResultsToExcel(options: ScanResultExportOptions): Promise<number> {
    const { taskId, taskInfo, filter, includeReviewColumns = false, onProgress } = options

    const rows = await fetchAllScanResultsForExport(taskId, filter, onProgress)
    if (rows.length === 0) {
        throw new Error('当前筛选条件下没有可导出的扫描结果')
    }

    const columns = buildExportColumns(includeReviewColumns)
    const headers = columns.map((c) => c.header)
    const dataRows = rows.map((row) => columns.map((col) => col.getValue(row)))

    const resultWs = XLSX.utils.aoa_to_sheet([headers, ...dataRows])
    resultWs['!cols'] = headers.map((header) => ({
        wch: Math.min(Math.max(header.length + 4, 14), 48),
    }))

    const infoWs = XLSX.utils.aoa_to_sheet(
        buildTaskInfoSheetRows(taskInfo, filter, rows.length),
    )
    infoWs['!cols'] = [{ wch: 18 }, { wch: 56 }]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, resultWs, '扫描结果')
    XLSX.utils.book_append_sheet(wb, infoWs, '任务信息')

    const fileName = `${sanitizeFileNameSegment(taskInfo.taskName)}_扫描结果_${formatTimestampForFileName()}.xlsx`
    XLSX.writeFile(wb, fileName)
    return rows.length
}
