// 任务状态枚举
export const TASK_STATUS = {
    NOT_STARTED: '未开始', // 未开始
    RUNNING: '进行中', // 进行中
    COMPLETED: '已完成', // 已完成
    FAILED: '失败' // 失败
}

// 任务状态标签映射
export const TASK_STATUS_MAP = {
    [TASK_STATUS.NOT_STARTED]: 'info',
    [TASK_STATUS.RUNNING]: 'warning',
    [TASK_STATUS.COMPLETED]: 'success',
    [TASK_STATUS.FAILED]: 'danger'
}
