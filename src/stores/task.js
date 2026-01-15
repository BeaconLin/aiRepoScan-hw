import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

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

// localStorage 存储键名
const STORAGE_KEY = 'aiRepoScan_tasks'
const USER_STORAGE_KEY = 'aiRepoScan_currentUser'

// 默认任务数据
const defaultTasks = [
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
]

// 从 localStorage 加载数据
const loadTasksFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultTasks
    }
  } catch (error) {
    console.error('加载任务数据失败:', error)
  }
  return defaultTasks
}

// 保存数据到 localStorage
const saveTasksToStorage = (tasks) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  } catch (error) {
    console.error('保存任务数据失败:', error)
  }
}

// 从 localStorage 加载用户信息
const loadUserFromStorage = () => {
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY)
    return stored || '当前用户'
  } catch (error) {
    console.error('加载用户信息失败:', error)
    return '当前用户'
  }
}

// 保存用户信息到 localStorage
const saveUserToStorage = (user) => {
  try {
    localStorage.setItem(USER_STORAGE_KEY, user)
  } catch (error) {
    console.error('保存用户信息失败:', error)
  }
}

export const useTaskStore = defineStore('task', () => {
  // 当前登录用户（从 localStorage 加载）
  const currentUser = ref(loadUserFromStorage())
  
  // 任务列表（从 localStorage 加载）
  const tasks = ref(loadTasksFromStorage())

  // 监听 tasks 变化，自动保存到 localStorage
  watch(
    tasks,
    (newTasks) => {
      saveTasksToStorage(newTasks)
    },
    { deep: true }
  )

  // 监听 currentUser 变化，自动保存到 localStorage
  watch(
    currentUser,
    (newUser) => {
      saveUserToStorage(newUser)
    }
  )

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
    // watch 会自动保存，但为了确保立即保存，这里也调用一次
    saveTasksToStorage(tasks.value)
    return newTask
  }

  // 删除任务
  const deleteTask = (taskId) => {
    const index = tasks.value.findIndex(task => task.id === taskId)
    if (index > -1) {
      tasks.value.splice(index, 1)
      // watch 会自动保存，但为了确保立即保存，这里也调用一次
      saveTasksToStorage(tasks.value)
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
      // watch 会自动保存，但为了确保立即保存，这里也调用一次
      saveTasksToStorage(tasks.value)
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
