import * as XLSX from 'xlsx'
import { exportTaskScanResultsExcel } from '@/api/taskManagementApi'
import type { TaskScanResultApiDocRow } from '@/api/types/taskApiDoc'

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

const EXCEL_CELL_MAX_LENGTH = 32767

function cellString(value: unknown): string {
  if (value == null) {
    return ''
  }
  const str = String(value)
  return str.length > EXCEL_CELL_MAX_LENGTH ? str.slice(0, EXCEL_CELL_MAX_LENGTH) : str
}

export function formatTimestampForFileName(date = new Date()): string {
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
}

function getAnnotationConclusionValue(row: TaskScanResultApiDocRow): string {
  if (row.annotation?.annotationStatus) {
    return formatIssueResultLabel(row.annotation.issueResult)
  }
  return '未标注'
}

function getAnnotationTimeValue(row: TaskScanResultApiDocRow): string {
  return row.annotation?.updateTime ?? row.annotation?.createTime ?? ''
}

function getReviewStatusValue(row: TaskScanResultApiDocRow): string {
  if (row.annotation?.annotationStatus) {
    return formatReviewStatusLabel(row.annotation.reviewStatus ?? 0)
  }
  return ''
}

function getFinalConclusionValue(row: TaskScanResultApiDocRow): string {
  if (row.annotation?.finalIssueResult != null) {
    return formatIssueResultLabel(row.annotation.finalIssueResult)
  }
  return ''
}

function buildBaseColumns(): ExportColumn[] {
  return [
    {header: '序号', getValue: (r) => r.self_increment_id ?? ''},
    {header: '告警ID', getValue: (r) => r.warn_uuid},
    {header: '文件路径', getValue: (r) => r.file_name},
    {header: '函数名', getValue: (r) => r.function_name ?? ''},
    {header: '规则名称', getValue: (r) => r.rule_name},
    {header: '告警行号', getValue: (r) => r.warn_line},
    {header: '起始行', getValue: (r) => r.start_line},
    {header: '结束行', getValue: (r) => r.end_line},
    {header: '问题说明', getValue: (r) => r.warn},
    {header: '问题代码', getValue: (r) => r.warn_code_block},
    {header: '切片代码', getValue: (r) => r.code_snippet},
    {header: '修改建议', getValue: (r) => r.context},
    {header: '发生条件与影响', getValue: (r) => r.reason ?? ''},
    {header: '置信度', getValue: (r) => cellString(r.confidence)},
    {header: '函数UUID', getValue: (r) => r.func_uuid},
    {header: '标注结论', getValue: getAnnotationConclusionValue},
    {header: '标注原因', getValue: (r) => r.annotation?.reason ?? ''},
    {header: '标注人工号', getValue: (r) => r.annotation?.userId ?? ''},
    {header: '标注人姓名', getValue: (r) => r.annotation?.userName ?? ''},
    {header: '标注人部门', getValue: (r) => r.annotation?.userDepartment ?? ''},
    {header: '标注时间', getValue: getAnnotationTimeValue},
  ]
}

function buildReviewColumns(): ExportColumn[] {
  return [
    {header: '评审状态', getValue: getReviewStatusValue},
    {header: '评审人工号', getValue: (r) => r.annotation?.reviewerUserId ?? ''},
    {header: '评审人姓名', getValue: (r) => r.annotation?.reviewerUserName ?? ''},
    {header: '评审时间', getValue: (r) => r.annotation?.reviewTime ?? ''},
    {header: '评审意见', getValue: (r) => r.annotation?.reviewComment ?? ''},
    {header: '最终结论', getValue: getFinalConclusionValue},
  ]
}

function buildExportColumns(includeReviewColumns: boolean): ExportColumn[] {
  const base = buildBaseColumns()
  if (!includeReviewColumns) {
    return base
  }
  return [...base, ...buildReviewColumns()]
}

/** mock 模式下本地生成单 Sheet Excel Blob */
export function generateScanResultsExcelBlob(
  rows: TaskScanResultApiDocRow[],
  includeReviewColumns = false,
): Blob {
  const columns = buildExportColumns(includeReviewColumns)
  const headers = columns.map((c) => c.header)
  const dataRows = rows.map((row) =>
    columns.map((col) => {
      const val = col.getValue(row)
      return cellString(val)
    }),
  )

  const resultWs = XLSX.utils.aoa_to_sheet([headers, ...dataRows])
  resultWs['!cols'] = headers.map((header) => ({
    wch: Math.min(Math.max(header.length + 4, 14), 48),
  }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, resultWs, '扫描结果')

  const arrayBuffer = XLSX.write(wb, {bookType: 'xlsx', type: 'array'})
  return new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
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
  const illegalChars = /[\\/:*?"<>|]/g
  const sanitized = taskName.replace(illegalChars, '_').trim().slice(0, 80) || '任务'
  const fallbackFileName = `${sanitized}_扫描结果_${formatTimestampForFileName()}.xlsx`
  const {blob, fileName} = await exportTaskScanResultsExcel(taskId)
  downloadBlobAsFile(blob, fileName || fallbackFileName)
}