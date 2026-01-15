<template>
  <div class="task-detail-page">
    <!-- 页面标题和返回按钮区域 -->
    <div class="page-header">
      <div class="header-left">
        <el-button @click="handleBack">← 返回任务列表</el-button>
        <h1>任务详情 - 扫描结果查看</h1>
      </div>
      <div v-if="task" class="header-right">
        <el-tag :type="TASK_STATUS_MAP[task.status].type" size="large">
          {{ TASK_STATUS_MAP[task.status].label }}
        </el-tag>
      </div>
    </div>

    <!-- 任务信息区域 -->
    <div v-if="task" class="task-info-section">
      <div class="section-label">任务信息</div>
      <div class="info-content">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">任务名称</div>
            <div class="info-value">{{ task.taskName }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">代码仓URL</div>
            <div class="info-value">
              <a :href="task.repoUrl" target="_blank" class="link-text">{{ task.repoUrl }}</a>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">创建人</div>
            <div class="info-value">{{ task.creator }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">创建时间</div>
            <div class="info-value">{{ task.createTime }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">扫描分支</div>
            <div class="info-value">{{ task.branch }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">扫描文件路径</div>
            <div class="info-value">
              <el-tag
                v-for="(path, index) in task.scanPaths"
                :key="index"
                size="small"
                style="margin-right: 8px; margin-bottom: 4px"
              >
                {{ path }}
              </el-tag>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">扫描助手版本</div>
            <div class="info-value">
              <el-tag
                v-for="version in task.assistantVersions"
                :key="version"
                size="small"
                type="info"
                style="margin-right: 8px; margin-bottom: 4px"
              >
                {{ version }}
              </el-tag>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">代码仓语言</div>
            <div class="info-value">{{ task.language }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">代码行数</div>
            <div class="info-value">{{ task.codeLines.toLocaleString() }} 行</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 未找到任务提示 -->
    <div v-else class="empty-section">
      <el-empty description="未找到该任务信息" />
    </div>

    <!-- 统计看板区域 - 仅当任务状态为已完成时显示 -->
    <div v-if="task && task.status === TASK_STATUS.COMPLETED && scanResults" class="dashboard-section">
      <div class="section-label">任务扫描结果统计看板</div>
      <div class="dashboard-content">
        <!-- 缺陷统计卡片 -->
        <div class="stat-card">
          <div class="stat-label">缺陷统计</div>
          <div class="stat-content">
            <div class="stat-item highlight">
              <span class="stat-label-text">总缺陷数：</span>
              <span class="stat-value-text">{{ statistics.totalIssues }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label-text">已标注：</span>
              <span class="stat-value-text">{{ statistics.annotated }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label-text">未标注：</span>
              <span class="stat-value-text">{{ statistics.unannotated }}</span>
            </div>
          </div>
        </div>

        <!-- 规则名称分布 -->
        <div class="stat-card">
          <div class="stat-label">规则名称分布</div>
          <div class="stat-content">
            <div
              v-for="(count, ruleName) in statistics.typeDistribution"
              :key="ruleName"
              class="stat-item"
            >
              <span class="stat-label-text">{{ ruleName }}：</span>
              <span class="stat-value-text">{{ count }}个</span>
            </div>
          </div>
        </div>

        <!-- 缺陷标记状态统计 -->
        <div class="stat-card">
          <div class="stat-label">缺陷标记状态统计</div>
          <div class="stat-content">
            <div class="stat-item">
              <span class="stat-label-text">是问题：</span>
              <span class="stat-value-text success">{{ statistics.markedAsIssue }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label-text">不是问题：</span>
              <span class="stat-value-text info">{{ statistics.markedAsNotIssue }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label-text">未标记：</span>
              <span class="stat-value-text warning">{{ statistics.unmarked }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 扫描结果列表区域 - 仅当任务状态为已完成时显示 -->
    <div v-if="task && task.status === TASK_STATUS.COMPLETED && scanResults" class="result-list-section">
      <div class="section-label">扫描结果列表</div>
      <div class="list-header">
        <div class="list-filter">
          <el-input
            v-model="filterForm.keyword"
            placeholder="搜索文件名称、规则名称或问题说明"
            clearable
            style="width: 300px"
            @input="handleFilter"
          />
          <el-select
            v-model="filterForm.ruleName"
            placeholder="按规则名称筛选"
            clearable
            style="width: 180px; margin-left: 12px"
            @change="handleFilter"
          >
            <el-option
              v-for="name in ruleNames"
              :key="name"
              :label="name"
              :value="name"
            />
          </el-select>
          <el-select
            v-model="filterForm.markStatus"
            placeholder="按标记状态筛选"
            clearable
            style="width: 150px; margin-left: 12px"
            @change="handleFilter"
          >
            <el-option label="是问题" value="is_issue" />
            <el-option label="不是问题" value="not_issue" />
            <el-option label="未标记" value="unmarked" />
          </el-select>
        </div>
      </div>
      <div class="list-content">
        <div v-if="filteredResults.length === 0" class="empty-results">
          <el-empty description="暂无扫描结果" />
        </div>
        <div
          v-for="result in paginatedResults"
          :key="result.id"
          class="result-item"
        >
          <div class="result-header">
            <span class="result-title">缺陷 #{{ result.id }}</span>
            <el-tag :type="getRuleNameTagType(result.rule_name)" size="small">
              {{ result.rule_name }}
            </el-tag>
            <el-tag
              v-if="result.markStatus !== 'unmarked'"
              :type="getMarkStatusTagType(result.markStatus)"
              size="small"
              style="margin-left: 8px"
            >
              {{ getMarkStatusLabel(result.markStatus) }}
            </el-tag>
          </div>
          <div class="result-body">
            <div class="result-field">
              <span class="field-label">文件名称：</span>
              <span class="field-value">{{ result.fileName }}</span>
            </div>
            <div class="result-field">
              <span class="field-label">问题行号：</span>
              <span class="field-value">第 {{ result.line }} 行</span>
            </div>
            <div class="result-field full-width">
              <span class="field-label">问题说明：</span>
              <span class="field-value">{{ result.warn }}</span>
            </div>
            <div class="result-field full-width">
              <span class="field-label">问题代码块：</span>
              <pre class="code-snippet">{{ result.code_block }}</pre>
            </div>
            <div class="result-field full-width">
              <span class="field-label">上下文代码：</span>
              <pre class="code-snippet context-code">{{ result.context }}</pre>
            </div>
          </div>
          <div class="result-actions">
            <el-button
              type="danger"
              size="small"
              :disabled="result.markStatus === 'is_issue'"
              @click="handleMark(result.id, 'is_issue')"
            >
              {{ result.markStatus === 'is_issue' ? '已标记为问题' : '标记为问题' }}
            </el-button>
            <el-button
              type="success"
              size="small"
              :disabled="result.markStatus === 'not_issue'"
              @click="handleMark(result.id, 'not_issue')"
            >
              {{ result.markStatus === 'not_issue' ? '已标记为非问题' : '标记为非问题' }}
            </el-button>
            <el-button
              v-if="result.markStatus !== 'unmarked'"
              type="info"
              size="small"
              @click="handleMark(result.id, 'unmarked')"
            >
              取消标记
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页区域 - 仅当任务状态为已完成时显示 -->
    <div
      v-if="task && task.status === TASK_STATUS.COMPLETED && filteredResults.length > 0"
      class="pagination-section"
    >
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[5, 10, 20, 50]"
        :total="filteredResults.length"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 任务未完成提示 -->
    <div v-if="task && task.status !== TASK_STATUS.COMPLETED" class="status-tip-section">
      <el-alert
        :title="getStatusTipTitle()"
        :description="getStatusTipDescription()"
        type="info"
        :closable="false"
        show-icon
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  ElButton, 
  ElTag, 
  ElInput, 
  ElSelect, 
  ElOption, 
  ElEmpty, 
  ElPagination,
  ElAlert,
  ElMessage
} from 'element-plus'
import { useTaskStore, TASK_STATUS, TASK_STATUS_MAP } from '../stores/task'

// 类型定义
interface Task {
  id: string
  taskName: string
  repoUrl: string
  branch: string
  scanPaths: string[]
  assistantVersions: string[]
  creator: string
  createTime: string
  status: string
  language: string
  codeLines: number
}

interface ScanResult {
  id: string
  fileName: string
  rule_name: string
  line: number
  code_block: string
  context: string
  warn: string
  markStatus: 'is_issue' | 'not_issue' | 'unmarked'
}

interface FilterForm {
  keyword: string
  ruleName: string
  markStatus: string
}

interface AnnotationData {
  markStatus: 'is_issue' | 'not_issue' | 'unmarked'
  annotator: string
  annotationTime: string
}

interface Annotations {
  [key: string]: AnnotationData
}

interface Statistics {
  totalIssues: number
  annotated: number
  unannotated: number
  typeDistribution: Record<string, number>
  markedAsIssue: number
  markedAsNotIssue: number
  unmarked: number
}

type MarkStatus = 'is_issue' | 'not_issue' | 'unmarked'
type TagType = 'success' | 'info' | 'warning' | 'danger'

const router = useRouter()
const route = useRoute()
const taskStore = useTaskStore()

// 任务信息
const task = ref<Task | null>(null)
const scanResults = ref<ScanResult[]>([])
const currentPage = ref<number>(1)
const pageSize = ref<number>(10)

// 筛选表单
const filterForm = ref<FilterForm>({
  keyword: '',
  ruleName: '',
  markStatus: ''
})

// localStorage 存储键名
const getAnnotationStorageKey = (taskId: string): string => {
  return `aiRepoScan_annotations_${taskId}`
}

// 从 localStorage 加载标记数据
const loadAnnotationsFromStorage = (taskId: string): Annotations => {
  try {
    const stored = localStorage.getItem(getAnnotationStorageKey(taskId))
    if (stored) {
      return JSON.parse(stored) as Annotations
    }
  } catch (error) {
    console.error('加载标记数据失败:', error)
  }
  return {}
}

// 保存标记数据到 localStorage
const saveAnnotationsToStorage = (taskId: string, annotations: Annotations): void => {
  try {
    localStorage.setItem(getAnnotationStorageKey(taskId), JSON.stringify(annotations))
  } catch (error) {
    console.error('保存标记数据失败:', error)
  }
}

// 生成mock扫描结果数据
const generateMockScanResults = (taskId: string): ScanResult[] => {
  const mockResults: ScanResult[] = [
    {
      id: '1',
      fileName: 'UserProfile.vue',
      rule_name: '不安全函数使用',
      line: 45,
      code_block: 'const result = eval(userInput);',
      context: 'function processUserInput(userInput) {\n  // 处理用户输入\n  const result = eval(userInput);\n  return result;\n}',
      warn: '使用了不安全的eval函数，可能导致代码注入攻击。建议使用JSON.parse()或其他安全的解析方法。',
      markStatus: 'unmarked'
    },
    {
      id: '2',
      fileName: 'api.js',
      rule_name: 'DOM操作性能问题',
      line: 128,
      code_block: 'document.getElementById("list").innerHTML += item;',
      context: 'for (let i = 0; i < items.length; i++) {\n  const item = items[i];\n  document.getElementById("list").innerHTML += item;\n}',
      warn: '在循环中进行了DOM操作，可能导致性能瓶颈。建议先构建完整的HTML字符串，然后一次性更新DOM。',
      markStatus: 'unmarked'
    },
    {
      id: '3',
      fileName: 'user.js',
      rule_name: '命名规范问题',
      line: 67,
      code_block: 'let user_name = "test";',
      context: 'function getUserInfo() {\n  let user_name = "test";\n  let user_age = 25;\n  return { user_name, user_age };\n}',
      warn: '变量命名不符合规范，建议使用驼峰命名（camelCase）。应改为userName。',
      markStatus: 'unmarked'
    },
    {
      id: '4',
      fileName: 'HomePage.vue',
      rule_name: 'XSS安全漏洞',
      line: 203,
      code_block: '<div v-html="userContent"></div>',
      context: '<template>\n  <div class="home-page">\n    <div v-html="userContent"></div>\n  </div>\n</template>',
      warn: '未对用户输入进行XSS防护处理，直接使用v-html可能导致XSS攻击。建议对用户输入进行转义处理或使用安全的渲染方法。',
      markStatus: 'unmarked'
    },
    {
      id: '5',
      fileName: 'request.js',
      rule_name: '缺少错误处理',
      line: 89,
      code_block: 'return data.items[0].name;',
      context: 'function getFirstItemName(response) {\n  const data = response.data;\n  return data.items[0].name;\n}',
      warn: '缺少错误处理机制，如果data或items为空或undefined，可能导致程序崩溃。建议添加空值检查和错误处理。',
      markStatus: 'unmarked'
    },
    {
      id: '6',
      fileName: 'DataTable.vue',
      rule_name: '大数据渲染性能问题',
      line: 156,
      code_block: '<div v-for="item in largeList" :key="item.id">',
      context: '<template>\n  <div class="data-table">\n    <div v-for="item in largeList" :key="item.id">\n      {{ item.name }}\n    </div>\n  </div>\n</template>',
      warn: '大量数据未使用虚拟滚动，可能导致页面卡顿。建议使用虚拟滚动组件（如el-virtual-list）来优化性能。',
      markStatus: 'unmarked'
    },
    {
      id: '7',
      fileName: 'validator.js',
      rule_name: '函数过长',
      line: 34,
      code_block: 'function validateForm(form) {',
      context: 'function validateForm(form) {\n  // 验证用户名\n  // 验证密码\n  // 验证邮箱\n  // ... 200行代码\n  return isValid;\n}',
      warn: '函数过长，建议拆分为多个小函数，提高代码可读性和可维护性。',
      markStatus: 'unmarked'
    }
  ]
  
  // 从 localStorage 加载已标记的数据
  const annotations = loadAnnotationsFromStorage(taskId)
  mockResults.forEach(result => {
    if (annotations[result.id]) {
      result.markStatus = annotations[result.id].markStatus
    }
  })
  
  return mockResults
}

// 计算属性：获取所有规则名称
const ruleNames = computed<string[]>(() => {
  if (!scanResults.value.length) return []
  const names = new Set(scanResults.value.map(r => r.rule_name))
  return Array.from(names)
})

// 计算属性：统计信息
const statistics = computed<Statistics>(() => {
  if (!scanResults.value.length) {
    return {
      totalIssues: 0,
      annotated: 0,
      unannotated: 0,
      typeDistribution: {},
      markedAsIssue: 0,
      markedAsNotIssue: 0,
      unmarked: 0
    }
  }

  const stats = {
    totalIssues: scanResults.value.length,
    annotated: 0,
    unannotated: 0,
    typeDistribution: {},
    markedAsIssue: 0,
    markedAsNotIssue: 0,
    unmarked: 0
  }

  scanResults.value.forEach(result => {
    // 统计标注状态
    if (result.markStatus === 'is_issue') {
      stats.markedAsIssue++
      stats.annotated++
    } else if (result.markStatus === 'not_issue') {
      stats.markedAsNotIssue++
      stats.annotated++
    } else {
      stats.unmarked++
      stats.unannotated++
    }

    // 统计规则名称分布
    if (!stats.typeDistribution[result.rule_name]) {
      stats.typeDistribution[result.rule_name] = 0
    }
    stats.typeDistribution[result.rule_name]++
  })

  return stats
})

// 计算属性：筛选后的结果
const filteredResults = computed<ScanResult[]>(() => {
  let results = scanResults.value

  // 关键词搜索
  if (filterForm.value.keyword) {
    const keyword = filterForm.value.keyword.toLowerCase()
    results = results.filter(r =>
      r.fileName.toLowerCase().includes(keyword) ||
      r.warn.toLowerCase().includes(keyword) ||
      r.rule_name.toLowerCase().includes(keyword)
    )
  }

  // 按规则名称筛选
  if (filterForm.value.ruleName) {
    results = results.filter(r => r.rule_name === filterForm.value.ruleName)
  }

  // 按标记状态筛选
  if (filterForm.value.markStatus) {
    results = results.filter(r => r.markStatus === filterForm.value.markStatus)
  }

  return results
})

// 计算属性：分页后的结果
const paginatedResults = computed<ScanResult[]>(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredResults.value.slice(start, end)
})

// 获取规则名称标签类型
const getRuleNameTagType = (ruleName: string): TagType => {
  // 根据规则名称关键词判断类型
  if (ruleName.includes('安全') || ruleName.includes('XSS') || ruleName.includes('注入')) {
    return 'danger'
  } else if (ruleName.includes('性能') || ruleName.includes('性能问题')) {
    return 'warning'
  } else if (ruleName.includes('规范') || ruleName.includes('命名')) {
    return 'info'
  } else {
    return 'warning'
  }
}

// 获取标记状态标签类型
const getMarkStatusTagType = (status: MarkStatus): TagType => {
  const statusMap: Record<MarkStatus, TagType> = {
    'is_issue': 'danger',
    'not_issue': 'success',
    'unmarked': 'info'
  }
  return statusMap[status] || 'info'
}

// 获取标记状态标签文本
const getMarkStatusLabel = (status: MarkStatus): string => {
  const labelMap: Record<MarkStatus, string> = {
    'is_issue': '是问题',
    'not_issue': '不是问题',
    'unmarked': '未标记'
  }
  return labelMap[status] || '未知'
}

// 标记处理
const handleMark = (resultId: string, markStatus: MarkStatus): void => {
  const result = scanResults.value.find(r => r.id === resultId)
  if (result) {
    result.markStatus = markStatus
    
    // 保存到 localStorage
    const taskId = route.params.id as string
    if (taskId) {
      const annotations = loadAnnotationsFromStorage(taskId)
      if (markStatus === 'unmarked') {
        // 取消标记，删除记录
        delete annotations[resultId]
        ElMessage.success('已取消标记')
      } else {
        // 保存标记
        annotations[resultId] = {
          markStatus,
          annotator: taskStore.currentUser,
          annotationTime: new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }).replace(/\//g, '-')
        }
        const statusText = markStatus === 'is_issue' ? '问题' : '非问题'
        ElMessage.success(`已标记为${statusText}`)
      }
      saveAnnotationsToStorage(taskId, annotations)
    }
  }
}

// 筛选处理
const handleFilter = (): void => {
  currentPage.value = 1
}

// 分页大小改变
const handleSizeChange = (size: number): void => {
  pageSize.value = size
  currentPage.value = 1
}

// 当前页改变
const handleCurrentChange = (page: number): void => {
  currentPage.value = page
}

// 获取状态提示标题
const getStatusTipTitle = (): string => {
  if (!task.value) return ''
  const statusMap: Record<string, string> = {
    [TASK_STATUS.NOT_STARTED]: '任务未开始',
    [TASK_STATUS.RUNNING]: '任务扫描中',
    [TASK_STATUS.FAILED]: '任务扫描失败'
  }
  return statusMap[task.value.status] || '任务状态异常'
}

// 获取状态提示描述
const getStatusTipDescription = (): string => {
  if (!task.value) return ''
  const descMap: Record<string, string> = {
    [TASK_STATUS.NOT_STARTED]: '该任务尚未开始扫描，请等待任务启动后查看扫描结果。',
    [TASK_STATUS.RUNNING]: '该任务正在扫描中，请稍候查看扫描结果。',
    [TASK_STATUS.FAILED]: '该任务扫描失败，无法查看扫描结果。'
  }
  return descMap[task.value.status] || '无法查看扫描结果。'
}

// 返回任务列表
const handleBack = (): void => {
  router.push('/tasks')
}

// 组件挂载时加载数据
onMounted(() => {
  const taskId = route.params.id as string
  if (taskId) {
    const foundTask = taskStore.getTaskById(taskId)
    if (foundTask) {
      task.value = foundTask as Task
      // 如果任务已完成，生成mock扫描结果
      if (foundTask.status === TASK_STATUS.COMPLETED) {
        scanResults.value = generateMockScanResults(taskId)
      }
    }
  }
})
</script>

<style scoped>
.task-detail-page {
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-right {
  display: flex;
  align-items: center;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.task-info-section,
.dashboard-section,
.result-list-section,
.pagination-section,
.status-tip-section {
  background: #ffffff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.empty-section {
  background: #ffffff;
  border-radius: 8px;
  padding: 60px 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
  font-size: 16px;
}

.info-content {
  display: flex;
  flex-direction: column;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-label {
  font-weight: 500;
  color: #6b7280;
  font-size: 14px;
}

.info-value {
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: #374151;
  font-size: 14px;
  min-height: 20px;
  word-break: break-all;
}

.link-text {
  color: #409eff;
  text-decoration: none;
}

.link-text:hover {
  text-decoration: underline;
}

.dashboard-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.stat-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  background: #f9fafb;
  transition: all 0.3s;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.stat-label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 15px;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  padding: 12px 16px;
  background: #ffffff;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-item.highlight {
  background: #eff6ff;
  border-color: #3b82f6;
}

.stat-label-text {
  color: #6b7280;
  font-size: 14px;
}

.stat-value-text {
  color: #374151;
  font-weight: 600;
  font-size: 16px;
}

.stat-value-text.success {
  color: #10b981;
}

.stat-value-text.info {
  color: #3b82f6;
}

.stat-value-text.warning {
  color: #f59e0b;
}

.list-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.list-filter {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.list-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-results {
  padding: 40px 0;
}

.result-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  background: #ffffff;
  transition: all 0.3s;
}

.result-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
}

.result-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.result-title {
  font-size: 15px;
  color: #1f2937;
}

.result-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-field {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  font-size: 14px;
}

.result-field.full-width {
  flex-direction: column;
  gap: 8px;
}

.field-label {
  color: #6b7280;
  font-weight: 500;
  min-width: 100px;
  flex-shrink: 0;
}

.field-value {
  color: #374151;
  word-break: break-all;
  flex: 1;
}

.code-snippet {
  background: #1f2937;
  color: #f9fafb;
  padding: 12px;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  overflow-x: auto;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.code-snippet.context-code {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.pagination-section {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.status-tip-section {
  margin-top: 24px;
}
</style>
