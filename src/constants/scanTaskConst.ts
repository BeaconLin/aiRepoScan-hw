// 任务状态枚举
export const TASK_STATUS = {
    NOT_STARTED: '未开始', // 未开始
    QUEUED: '排队中', // 已启动，排队等待执行
    RUNNING: '进行中', // 进行中
    COMPLETED: '已完成', // 已完成
    FAILED: '失败' // 失败
}

/** Element Plus 标签 type（排队中另用自定义浅蓝样式） */
export type TaskStatusElTagType = 'success' | 'info' | 'warning' | 'danger'

// 任务状态标签映射
export const TASK_STATUS_MAP: Record<string, TaskStatusElTagType> = {
    [TASK_STATUS.NOT_STARTED]: 'info',
    [TASK_STATUS.QUEUED]: 'info',
    [TASK_STATUS.RUNNING]: 'warning',
    [TASK_STATUS.COMPLETED]: 'success',
    [TASK_STATUS.FAILED]: 'danger',
}

/** 需自定义样式的任务状态标签 class */
export const TASK_STATUS_TAG_CLASS: Partial<Record<string, string>> = {
    [TASK_STATUS.QUEUED]: 'task-status-tag--queued',
}

export function getTaskStatusElTagType(status: string | undefined): TaskStatusElTagType | undefined {
    if (!status) return 'info'
    if (status === TASK_STATUS.QUEUED) return undefined
    return TASK_STATUS_MAP[status] ?? 'info'
}

export function getTaskStatusTagClass(status: string | undefined): string {
    if (!status) return ''
    return TASK_STATUS_TAG_CLASS[status] ?? ''
}
