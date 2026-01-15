import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 任务状态枚举
export const TASK_STATUS = {
  NOT_STARTED: 'not_started',  // 未开始
  RUNNING: 'running',          // 进行中
  COMPLETED: 'completed',      // 已完成
  FAILED: 'failed'             // 失败
}

// 任务状态标签映射
export const TASK_STATUS_MAP = {
  [TASK_STATUS.NOT_STARTED]: { label: '未开始', type: 'info' },
  [TASK_STATUS.RUNNING]: { label: '进行中', type: 'warning' },
  [TASK_STATUS.COMPLETED]: { label: '已完成', type: 'success' },
  [TASK_STATUS.FAILED]: { label: '失败', type: 'danger' }
}

export const useTaskStore = defineStore('task', () => {
  // 当前登录用户（模拟）
  const currentUser = ref('当前用户')
  
  // 任务列表
  const tasks = ref([
    {
      id: '1',
      taskName: '前端代码扫描任务',
      repoUrl: 'https://github.com/example/frontend.git',
      branch: 'main',
      scanPaths: ['src/', 'public/'],
      assistantVersions: ['v2.0.0', 'v2.1.0'],
      creator: '当前用户',
      createTime: '2024-01-15 10:30:00',
      status: TASK_STATUS.COMPLETED,
      language: 'JavaScript',
      codeLines: 15000
    },
    {
      id: '2',
      taskName: '后端API扫描任务',
      repoUrl: 'https://github.com/example/backend.git',
      branch: 'develop',
      scanPaths: ['app/', 'config/'],
      assistantVersions: ['v1.1.0'],
      creator: '其他用户',
      createTime: '2024-01-14 14:20:00',
      status: TASK_STATUS.RUNNING,
      language: 'Python',
      codeLines: 25000
    },
    {
      id: '3',
      taskName: '移动端代码扫描',
      repoUrl: 'https://github.com/example/mobile.git',
      branch: 'master',
      scanPaths: ['ios/', 'android/'],
      assistantVersions: ['v2.0.0'],
      creator: '当前用户',
      createTime: '2024-01-13 09:15:00',
      status: TASK_STATUS.NOT_STARTED,
      language: 'Swift',
      codeLines: 8000
    },
    {
      id: '4',
      taskName: '微服务架构扫描',
      repoUrl: 'https://github.com/example/microservices.git',
      branch: 'main',
      scanPaths: ['services/', 'gateway/'],
      assistantVersions: ['v2.1.0', 'v2.0.0'],
      creator: '其他用户',
      createTime: '2024-01-12 16:45:00',
      status: TASK_STATUS.FAILED,
      language: 'Java',
      codeLines: 50000
    },
    {
      id: '5',
      taskName: '数据库迁移脚本扫描',
      repoUrl: 'https://github.com/example/db-migration.git',
      branch: 'main',
      scanPaths: ['migrations/'],
      assistantVersions: ['v1.0.0'],
      creator: '当前用户',
      createTime: '2024-01-11 11:30:00',
      status: TASK_STATUS.COMPLETED,
      language: 'SQL',
      codeLines: 3000
    }
  ])

  // 添加任务
  const addTask = (taskData) => {
    const newTask = {
      id: Date.now().toString(),
      ...taskData,
      status: TASK_STATUS.NOT_STARTED,
      language: 'Unknown',
      codeLines: 0
    }
    tasks.value.unshift(newTask)
    return newTask
  }

  // 删除任务
  const deleteTask = (taskId) => {
    const index = tasks.value.findIndex(task => task.id === taskId)
    if (index > -1) {
      tasks.value.splice(index, 1)
      return true
    }
    return false
  }

  // 获取任务详情
  const getTaskById = (taskId) => {
    return tasks.value.find(task => task.id === taskId)
  }

  // 更新任务状态
  const updateTaskStatus = (taskId, status) => {
    const task = tasks.value.find(task => task.id === taskId)
    if (task) {
      task.status = status
      return true
    }
    return false
  }

  return {
    currentUser,
    tasks,
    addTask,
    deleteTask,
    getTaskById,
    updateTaskStatus
  }
})
