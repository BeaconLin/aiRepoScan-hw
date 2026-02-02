import { TASK_STATUS } from '../stores/task'

// Mock 任务详情数据（基于 defaultTasks）
const mockTaskDetails = {
    'T00112233-4455-6677-8899-aabbccddeeff': {
        taskId: 'T00112233-4455-6677-8899-aabbccddeeff',
        taskName: '前端代码扫描任务',
        repoUrl: 'https://github.com/example/frontend.git',
        branch: 'main',
        pathList: ['src', 'main'],
        assistantVersions: ['v2.0.0', 'v2.1.0'],
        creator: 'a00559876',
        createTime: '2024-01-15 10:30:00',
        taskStatus: TASK_STATUS.COMPLETED,
        codeLanguage: 'JavaScript',
        lineNum: 1.5,
        productName: 'UDM',
        s3Path: 's3://ai-repo-scan/results/T00112233-4455-6677-8899-aabbccddeeff',
        scanResults: []
    },
    'T11223344-5566-7788-99aa-bbccddeeff00': {
        taskId: 'T11223344-5566-7788-99aa-bbccddeeff00',
        taskName: '后端API扫描任务',
        repoUrl: 'https://github.com/example/backend.git',
        branch: 'develop',
        pathList: ['app', 'config'],
        assistantVersions: ['v1.1.0'],
        creator: 'a00559877',
        createTime: '2024-01-14 14:20:00',
        taskStatus: TASK_STATUS.RUNNING,
        codeLanguage: 'Python',
        lineNum: 2.5,
        productName: 'UDM',
        s3Path: 's3://ai-repo-scan/results/T11223344-5566-7788-99aa-bbccddeeff00',
        scanResults: []
    },
    'T22334455-6677-8899-aabb-ccddeeff0011': {
        taskId: 'T22334455-6677-8899-aabb-ccddeeff0011',
        taskName: '移动端代码扫描',
        repoUrl: 'https://github.com/example/mobile.git',
        branch: 'master',
        pathList: ['ios', 'android'],
        assistantVersions: ['v2.0.0'],
        creator: 'a00559876',
        createTime: '2024-01-13 09:15:00',
        taskStatus: TASK_STATUS.NOT_STARTED,
        codeLanguage: 'Swift',
        lineNum: 0.8,
        productName: '移动应用',
        s3Path: 's3://ai-repo-scan/results/T22334455-6677-8899-aabb-ccddeeff0011',
        scanResults: []
    }
}

// Mock 扫描结果数据
const mockScanResults = {
    'T00112233-4455-6677-8899-aabbccddeeff': [{
            warn_uuid: 'w00112233-4455-6677-8899-aabbccddeeff',
            file_name: 'UserProfile.vue',
            rule_name: '不安全函数使用',
            warn_line: 45,
            warn_code_block: 'const result = eval(userInput);',
            code_snippet: 'const result = eval(userInput);',
            context: 'function processUserInput(userInput) {\n  // 处理用户输入\n  const result = eval(userInput);\n  return result;\n}',
            warn: '使用了不安全的eval函数，可能导致代码注入攻击。建议使用JSON.parse()或其他安全的解析方法。',
            check_function_id: 'func-001',
            confidence: '85%',
            start_line: 40,
            end_line: 50,
            func_uuid: 'func-uuid-001',
            index: 1,
            reason: null,
            issue_result: null
        },
        {
            warn_uuid: 'w11223344-5566-7788-99aa-bbccddeeff00',
            file_name: 'api.js',
            rule_name: 'DOM操作性能问题',
            warn_line: 128,
            warn_code_block: 'document.getElementById("list").innerHTML += item;',
            code_snippet: 'document.getElementById("list").innerHTML += item;',
            context: 'for (let i = 0; i < items.length; i++) {\n  const item = items[i];\n  document.getElementById("list").innerHTML += item;\n}',
            warn: '在循环中进行了DOM操作，可能导致性能瓶颈。建议先构建完整的HTML字符串，然后一次性更新DOM。',
            check_function_id: 'func-002',
            confidence: '90%',
            start_line: 125,
            end_line: 132,
            func_uuid: 'func-uuid-002',
            index: 2,
            reason: null,
            issue_result: null
        },
        {
            warn_uuid: 'w22334455-6677-8899-aabb-ccddeeff0011',
            file_name: 'user.js',
            rule_name: '命名规范问题',
            warn_line: 67,
            warn_code_block: 'let user_name = "test";',
            code_snippet: 'let user_name = "test";',
            context: 'function getUserInfo() {\n  let user_name = "test";\n  let user_age = 25;\n  return { user_name, user_age };\n}',
            warn: '变量命名不符合规范，建议使用驼峰命名（camelCase）。应改为userName。',
            check_function_id: 'func-003',
            confidence: '75%',
            start_line: 65,
            end_line: 70,
            func_uuid: 'func-uuid-003',
            index: 3,
            reason: null,
            issue_result: null
        },
        {
            warn_uuid: 'w33445566-7788-99aa-bbcc-ccddeeff0011',
            file_name: 'HomePage.vue',
            rule_name: 'XSS安全漏洞',
            warn_line: 203,
            warn_code_block: '<div v-html="userContent"></div>',
            code_snippet: '<div v-html="userContent"></div>',
            context: '<template>\n  <div class="home-page">\n    <div v-html="userContent"></div>\n  </div>\n</template>',
            warn: '未对用户输入进行XSS防护处理，直接使用v-html可能导致XSS攻击。建议对用户输入进行转义处理或使用安全的渲染方法。',
            check_function_id: 'func-004',
            confidence: '95%',
            start_line: 200,
            end_line: 206,
            func_uuid: 'func-uuid-004',
            index: 4,
            reason: null,
            issue_result: null
        },
        {
            warn_uuid: 'w44556677-8899-aabb-bbcc-ccddeeff0011',
            file_name: 'request.js',
            rule_name: '缺少错误处理',
            warn_line: 89,
            warn_code_block: 'return data.items[0].name;',
            code_snippet: 'return data.items[0].name;',
            context: 'function getFirstItemName(response) {\n  const data = response.data;\n  return data.items[0].name;\n}',
            warn: '缺少错误处理机制，如果data或items为空或undefined，可能导致程序崩溃。建议添加空值检查和错误处理。',
            check_function_id: 'func-005',
            confidence: '80%',
            start_line: 87,
            end_line: 91,
            func_uuid: 'func-uuid-005',
            index: 5,
            reason: null,
            issue_result: null
        },
        {
            warn_uuid: 'w55667788-99aa-aabb-bbcc-ccddeeff0011',
            file_name: 'DataTable.vue',
            rule_name: '大数据渲染性能问题',
            warn_line: 156,
            warn_code_block: '<div v-for="item in largeList" :key="item.id">',
            code_snippet: '<div v-for="item in largeList" :key="item.id">',
            context: '<template>\n  <div class="data-table">\n    <div v-for="item in largeList" :key="item.id">\n      {{ item.name }}\n    </div>\n  </div>\n</template>',
            warn: '大量数据未使用虚拟滚动，可能导致页面卡顿。建议使用虚拟滚动组件（如el-virtual-list）来优化性能。',
            check_function_id: 'func-006',
            confidence: '88%',
            start_line: 154,
            end_line: 159,
            func_uuid: 'func-uuid-006',
            index: 6,
            reason: null,
            issue_result: null
        },
        {
            warn_uuid: 'w66778899-aabb-bbcc-ccdd-ccddeeff0011',
            file_name: 'validator.js',
            rule_name: '函数过长',
            warn_line: 34,
            warn_code_block: 'function validateForm(form) {',
            code_snippet: 'function validateForm(form) {',
            context: 'function validateForm(form) {\n  // 验证用户名\n  // 验证密码\n  // 验证邮箱\n  // ... 200行代码\n  return isValid;\n}',
            warn: '函数过长，建议拆分为多个小函数，提高代码可读性和可维护性。',
            check_function_id: 'func-007',
            confidence: '70%',
            start_line: 34,
            end_line: 234,
            func_uuid: 'func-uuid-007',
            index: 7,
            reason: null,
            issue_result: null
        }
    ],
    'T11223344-5566-7788-99aa-bbccddeeff00': [],
    'T22334455-6677-8899-aabb-ccddeeff0011': []
}

// localStorage 存储键名
const getAnnotationStorageKey = (taskId) => {
    return `aiRepoScan_annotations_${taskId}`
}

// 从 localStorage 加载标记数据
const loadAnnotationsFromStorage = (taskId) => {
    try {
        const stored = localStorage.getItem(getAnnotationStorageKey(taskId))
        if (stored) {
            return JSON.parse(stored)
        }
    } catch (error) {
        console.error('加载标记数据失败:', error)
    }
    return {}
}

/**
 * 从 localStorage 获取任务详情（用于支持新创建的任务）
 * @param {string} taskId - 任务ID
 * @returns {Object|null} 任务详情对象
 */
const getTaskFromStorage = (taskId) => {
    try {
        const stored = localStorage.getItem('aiRepoScan_tasks')
        if (stored) {
            const tasks = JSON.parse(stored)
                // 兼容旧数据格式，支持通过id或taskId查找
            const task = tasks.find(task => (task.taskId || task.id) === taskId) || null
            if (task) {
                // 转换为新格式
                return {
                    ...task,
                    taskId: task.taskId || task.id,
                    taskStatus: task.taskStatus || task.status,
                    pathList: task.pathList || task.scanPaths || [],
                    codeLanguage: task.codeLanguage || task.language || 'Unknown',
                    lineNum: task.lineNum || (task.codeLines ? task.codeLines / 10000 : 0),
                    productName: task.productName || task.product_name || '-',
                    s3Path: task.s3Path || `s3://ai-repo-scan/results/${task.taskId || task.id}`,
                    scanResults: task.scanResults || []
                }
            }
            return null
        }
    } catch (error) {
        console.error('从 localStorage 加载任务失败:', error)
    }
    return null
}

/**
 * 模拟通过 taskId 获取任务详情
 * @param {string} taskId - 任务ID
 * @returns {Promise<Object>} 任务详情对象
 */
export const fetchTaskDetail = async(taskId) => {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 300))

    // 首先从 mock 数据中查找
    let taskDetail = mockTaskDetails[taskId]

    // 如果 mock 数据中没有，尝试从 localStorage 中获取（支持新创建的任务）
    if (!taskDetail) {
        taskDetail = getTaskFromStorage(taskId)
            // 如果从 localStorage 获取到任务，补充默认的元信息字段
        if (taskDetail) {
            taskDetail = {
                ...taskDetail,
                // 兼容旧数据格式，转换为新格式
                taskId: taskDetail.taskId || taskDetail.id,
                taskStatus: taskDetail.taskStatus || taskDetail.status,
                pathList: taskDetail.pathList || taskDetail.scanPaths || [],
                codeLanguage: taskDetail.codeLanguage || taskDetail.language || 'Unknown',
                lineNum: taskDetail.lineNum || (taskDetail.codeLines ? taskDetail.codeLines / 10000 : 0),
                productName: taskDetail.productName || taskDetail.product_name || '-',
                s3Path: taskDetail.s3Path || `s3://ai-repo-scan/results/${taskDetail.taskId || taskDetail.id}`,
                scanResults: taskDetail.scanResults || []
            }
        }
    }

    if (!taskDetail) {
        throw new Error(`未找到任务ID为 ${taskId} 的任务详情`)
    }

    return {
        code: 200,
        message: '获取成功',
        data: {...taskDetail }
    }
}

/**
 * 模拟通过 taskId 获取扫描结果列表
 * @param {string} taskId - 任务ID
 * @returns {Promise<Array>} 扫描结果数组
 */
export const fetchScanResults = async(taskId) => {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500))

    const results = mockScanResults[taskId] || []

    // 从 localStorage 加载已标注的数据
    const annotations = loadAnnotationsFromStorage(taskId)
    const resultsWithAnnotations = results.map(result => {
        const warnUuid = result.warn_uuid || result.id
        if (annotations[warnUuid]) {
            return {
                ...result,
                issue_result: annotations[warnUuid].issue_result,
                reason: annotations[warnUuid].reason || null
            }
        }
        return result
    })

    return {
        code: 200,
        message: '获取成功',
        data: resultsWithAnnotations
    }
}