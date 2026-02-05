import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { TASK_STATUS } from '../constants/scanTaskConst'

// localStorage 存储键名
const STORAGE_KEY = 'aiRepoScan_tasks'
const USER_STORAGE_KEY = 'aiRepoScan_currentUser'

// 默认任务数据
const defaultTasks = [{
    taskId: 'T00112233-4455-6677-8899-aabbccddeeff',
    taskName: '前端代码扫描任务',
    repoUrl: 'https://github.com/example/frontend.git',
    branch: 'main',
    pathList: ['src', 'main'],
    assistantVersions: ['v2.0.0', 'v2.1.0'],
    creator: 'a00559876',
    createTime: '2024-01-15 10:30:00',
    taskStatus: '已完成',
    codeLanguage: 'C++',
    lineNum: 1.5,
    productName: 'UDM',
    s3Path: 's3://ai-repo-scan/results/T00112233-4455-6677-8899-aabbccddeeff',
    scanResults: []
}, ]

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
        }, { deep: true }
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
        // 生成以T开头的uuid格式的taskId
        const generateTaskId = () => {
            const timestamp = Date.now().toString(16)
            const random = Math.random().toString(16).substring(2, 10)
            return `T${timestamp}-${random.substring(0, 4)}-${random.substring(4, 8)}-${random.substring(8, 12)}-${random.substring(12, 20)}`
        }

        const newTask = {
            taskId: generateTaskId(),
            ...taskData,
            taskStatus: '未开始',
            codeLanguage: taskData.codeLanguage || 'Unknown',
            lineNum: taskData.lineNum || 0,
            scanResults: [],
            s3Path: taskData.s3Path || `s3://ai-repo-scan/results/${generateTaskId()}`
        }
        tasks.value.unshift(newTask)
            // watch 会自动保存，但为了确保立即保存，这里也调用一次
        saveTasksToStorage(tasks.value)
        return newTask
    }

    // 删除任务
    const deleteTask = (taskId) => {
        const index = tasks.value.findIndex(task => task.taskId === taskId)
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
        return tasks.value.find(task => task.taskId === taskId)
    }

    // 更新任务状态
    const updateTaskStatus = (taskId, status) => {
        const task = tasks.value.find(task => task.taskId === taskId)
        if (task) {
            task.taskStatus = status
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