import type { ReviewRecordSummary } from '@/api/types/annotationReview'

/** 0: 需要修改, 1: 无需修改的问题, 2: 问题误报, null: 未标注 */
export type IssueResult = 0 | 1 | 2 | null

export type TagType = 'success' | 'info' | 'warning' | 'danger'

export interface Task {
  taskId: string
  taskName: string
  repoUrl: string
  branch: string
  pathList: string
  assistantVersions?: string | string[]
  creator: string
  nameCn?: string
  createTime: string
  taskStatus: string
  codeLanguage: string
  lineNum: number
  productName?: string
  dept_name?: string
  pdu_name?: string
  s3Path?: string
  hostUrl?: string
  modelName?: string
  /** 中止后重启是否从头扫描：true 从头开始，false 从中止处继续 */
  rescan?: boolean
  warnCount?: number | null
  scanResults: unknown[]
  // 兼容旧数据格式
  id?: string
  status?: string
  scanPaths?: string | string[]
  language?: string
  codeLines?: number
  product_name?: string
}

export interface Annotation {
  id?: number
  warnUuid: string
  userId: string
  issueResult: IssueResult
  reason: string | null
  annotationStatus?: number
  createTime?: string
  updateTime?: string
  userName?: string | null
  userDepartment?: string | null
  taskId?: string | null
  reviewStatus?: number | null
  reviewerUserId?: string | null
  reviewerUserName?: string | null
  reviewTime?: string | null
}

export interface RejectedAnnotationSnapshot {
  issueResult: number
  reason: string | null
  userId: string
  userName: string | null
}

export interface ScanResult {
  warn_uuid: string
  file_name: string
  rule_name: string
  warn_line: number
  warn_code_block: string
  code_snippet: string
  context: string
  warn: string
  check_function_id: string
  confidence: string
  start_line: number
  end_line: number
  func_uuid: string
  index: number
  self_increment_id?: number
  reason: string | null
  issue_result: IssueResult
  annotator?: string
  annotationTime?: string
  annotation: Annotation | null
  lastReview?: ReviewRecordSummary | null
  rejectedAnnotationSnapshot?: RejectedAnnotationSnapshot | null
  id?: string
  fileName?: string
  line?: number
  code_block?: string
}

export interface FilterForm {
  keyword: string
  ruleName: string
  issueResult: string
  reviewStatus: string
}

export interface RuleTreeNode {
  id: string
  label: string
  ruleName?: string
  count: number
  children?: RuleTreeNode[]
}
