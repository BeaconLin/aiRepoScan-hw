import * as XLSX from 'xlsx'
import { exportTaskScanResultsExcel } from '@/api/taskManagementApi'
import type { TaskScanResultApiDocRow } from '@/api/types/taskApiDoc'

/** 单次分页拉取条数（mock 导出专用） */
export const SCAN_RESULT_EXPORT_PAGE_SIZE = 200

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

export function sanitizeFileNameSegment(name: string): string {
    return name.replace(/[\\/:*?"<>|]/g, '_').trim().slice(0, 80) || '任务'
}

export function formatTimestampForFileName(date = new Date()): string {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
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

/** mock 模式下本地生成单 Sheet Excel Blob */
export function generateScanResultsExcelBlob(
    rows: TaskScanResultApiDocRow[],
    includeReviewColumns = false,
): Blob {
    const columns = buildExportColumns(includeReviewColumns)
    const headers = columns.map((c) => c.header)
    const dataRows = rows.map((row) => columns.map((col) => col.getValue(row)))

    const resultWs = XLSX.utils.aoa_to_sheet([headers, ...dataRows])
    resultWs['!cols'] = headers.map((header) => ({
        wch: Math.min(Math.max(header.length + 4, 14), 48),
    }))

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, resultWs, '扫描结果')

    const arrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    return new Blob([arrayBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
}

export function parseContentDispositionFilename(
    contentDisposition: string | undefined,
    fallback: string,
): string {
    if (!contentDisposition) {
        return fallback
    }

    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;\n]+)/i)
    if (utf8Match?.[1]) {
        try {
            return decodeURIComponent(utf8Match[1].trim())
        } catch {
            return utf8Match[1].trim()
        }
    }

    const plainMatch = contentDisposition.match(/filename="?([^";\n]+)"?/i)
    if (plainMatch?.[1]) {
        return plainMatch[1].trim()
    }

    return fallback
}

export function downloadBlobAsFile(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
}

/** 调用服务端 export-excel 接口并触发浏览器下载 */
export async function downloadScanResultsExcel(taskId: string, taskName: string): Promise<void> {
    const fallbackFileName = `${sanitizeFileNameSegment(taskName)}_扫描结果_${formatTimestampForFileName()}.xlsx`
    const { blob, fileName } = await exportTaskScanResultsExcel(taskId)
    downloadBlobAsFile(blob, fileName || fallbackFileName)
}
