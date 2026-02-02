<template>
  <div class="task-detail-page">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- 错误提示 -->
    <div v-else-if="error" class="error-container">
      <el-alert
        :title="error"
        type="error"
        :closable="false"
        show-icon
      />
      <el-button type="primary" style="margin-top: 16px" @click="handleRetry">
        重试
      </el-button>
    </div>

    <!-- 正常内容 -->
    <template v-else>
      <!-- 页面标题和返回按钮区域 -->
      <div class="page-header">
        <div class="header-left">
          <el-button @click="handleBack">← 返回任务列表</el-button>
          <h1 v-if="task">{{ task.taskName }}</h1>
          <h1 v-else>任务详情</h1>
          <el-tag v-if="task" :type="TASK_STATUS_MAP[task.taskStatus].type" size="large" class="status-tag">
            {{ TASK_STATUS_MAP[task.taskStatus].label }}
          </el-tag>
        </div>
      </div>

      <!-- 视图切换标签页 -->
      <el-tabs v-model="activeView" class="view-tabs">
        <!-- 任务基本信息统计视图 -->
        <el-tab-pane label="任务信息" name="info">
          <div class="view-content">
            <!-- 任务信息区域 -->
            <div v-if="task" class="task-info-section">
      <!-- 核心信息卡片 -->
      <div class="core-info-card">
        <div class="core-info-main">
          <div class="main-info-row">
            <div class="repo-url-block">
              <div class="repo-url-label">代码仓地址</div>
              <a :href="task.repoUrl" target="_blank" class="repo-url-value">
                <span class="repo-icon">🔗</span>
                <span class="repo-url-text">{{ task.repoUrl }}</span>
              </a>
            </div>
            <div class="repo-url-block">
              <div class="repo-url-label">代码行数</div>
              <div class="repo-url-value">
                <span class="repo-icon">📊</span>
                <span class="repo-url-text">{{ task.lineNum }}万行</span>
              </div>
            </div>
            <div class="repo-url-block">
              <div class="repo-url-label">代码语言</div>
              <div class="repo-url-value">
                <span class="repo-icon">💻</span>
                <span class="repo-url-text">{{ task.codeLanguage }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 配置信息卡片 -->
      <div class="config-info-card">
        <div class="config-header">
          <span class="config-title">扫描配置</span>
        </div>
        <div class="config-content">
          <div class="config-item">
            <div class="config-label">
              <span class="config-icon">🌿</span>
              <span>扫描分支</span>
            </div>
            <div class="config-value">{{ task.branch }}</div>
          </div>
          <div class="config-item">
            <div class="config-label">
              <span class="config-icon">🤖</span>
              <span>助手版本</span>
            </div>
            <div class="config-value">
              <el-tag
                v-for="version in task.assistantVersions"
                :key="version"
                size="small"
                type="info"
                class="version-tag"
              >
                {{ version }}
              </el-tag>
            </div>
          </div>
            <div class="config-item full-width">
            <div class="config-label">
              <span class="config-icon">📁</span>
              <span>扫描路径</span>
            </div>
            <div class="config-value">
              <el-tag
                v-for="(path, index) in task.pathList"
                :key="index"
                size="small"
                class="path-tag"
              >
                {{ path }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- 元信息卡片 -->
      <div class="meta-info-card">
        <div class="meta-item">
          <div class="meta-label">
            <span class="meta-icon">👤</span>
            <span>创建人</span>
          </div>
          <div class="meta-value">{{ task.creator }}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">
            <span class="meta-icon">🕐</span>
            <span>创建时间</span>
          </div>
          <div class="meta-value">{{ task.createTime }}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">
            <span class="meta-icon">🏢</span>
            <span>所属部门/开发部</span>
          </div>
          <div class="meta-value">{{ task.dept_name || '-' }}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">
            <span class="meta-icon">🏭</span>
            <span>所属PDU</span>
          </div>
          <div class="meta-value">{{ task.pdu_name || '-' }}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">
            <span class="meta-icon">📦</span>
            <span>产品名称</span>
          </div>
          <div class="meta-value">{{ task.productName || '-' }}</div>
        </div>
      </div>
    </div>

              <!-- 未找到任务提示 -->
              <div v-else class="empty-section">
                <el-empty description="未找到该任务信息" />
              </div>

              <!-- 统计看板区域 - 仅当任务状态为已完成时显示 -->
              <div v-if="task && task.taskStatus === TASK_STATUS.COMPLETED && scanResults" class="dashboard-section">
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

                  <!-- 缺陷标注状态统计 -->
                  <div class="stat-card">
                    <div class="stat-label">缺陷标注状态统计</div>
                    <div class="stat-content">
                      <div class="stat-item">
                        <span class="stat-label-text">需要修改：</span>
                        <span class="stat-value-text danger">{{ statistics.needModify }}</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label-text">无需修改的问题：</span>
                        <span class="stat-value-text warning">{{ statistics.noNeedModify }}</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label-text">问题误报：</span>
                        <span class="stat-value-text info">{{ statistics.falsePositive }}</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label-text">未标注：</span>
                        <span class="stat-value-text">{{ statistics.unmarked }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 任务未完成提示 -->
              <div v-if="task && task.taskStatus !== TASK_STATUS.COMPLETED" class="status-tip-section">
                <el-alert
                  :title="getStatusTipTitle()"
                  :description="getStatusTipDescription()"
                  type="info"
                  :closable="false"
                  show-icon
                />
              </div>
            </div>
          </el-tab-pane>

          <!-- 标注视图 -->
          <el-tab-pane label="标注视图" name="annotation">
            <div class="view-content">
              <!-- 扫描结果列表和规则树区域 - 仅当任务状态为已完成时显示 -->
              <div v-if="task && task.taskStatus === TASK_STATUS.COMPLETED && scanResults" class="result-list-container">
      <!-- 左侧：扫描结果列表 -->
      <div class="result-list-section">
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
              @change="handleRuleSelectChange"
            >
              <el-option
                v-for="name in ruleNames"
                :key="name"
                :label="name"
                :value="name"
              />
            </el-select>
            <el-select
              v-model="filterForm.issueResult"
              placeholder="按标注状态筛选"
              clearable
              style="width: 180px; margin-left: 12px"
              @change="handleFilter"
            >
              <el-option label="需要修改" value="0" />
              <el-option label="无需修改的问题" value="1" />
              <el-option label="问题误报" value="2" />
              <el-option label="未标注" value="unmarked" />
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
              <span class="result-title">缺陷 #{{ result.index }}</span>
              <el-tag :type="getRuleNameTagType(result.rule_name)" size="small">
                {{ result.rule_name }}
              </el-tag>
              <el-tag
                v-if="result.issue_result !== null"
                :type="getIssueResultTagType(result.issue_result)"
                size="small"
                style="margin-left: 8px"
              >
                {{ getIssueResultLabel(result.issue_result) }}
              </el-tag>
              <el-tag v-if="result.confidence" size="small" type="info" style="margin-left: 8px">
                置信度: {{ result.confidence }}
              </el-tag>
            </div>
            <div class="result-body">
              <div class="result-field">
                <span class="field-label">文件名称：</span>
                <span class="field-value">{{ result.file_name || result.fileName }}</span>
              </div>
              <div class="result-field">
                <span class="field-label">问题行号：</span>
                <span class="field-value">第 {{ result.warn_line || result.line }} 行</span>
              </div>
              <div class="result-field">
                <span class="field-label">代码行范围：</span>
                <span class="field-value">{{ result.start_line }} - {{ result.end_line }}</span>
              </div>
              <div class="result-field full-width">
                <span class="field-label">问题说明：</span>
                <span class="field-value">{{ result.warn }}</span>
              </div>
              <div class="result-field full-width">
                <span class="field-label">问题代码块：</span>
                <pre class="code-snippet">{{ result.warn_code_block || result.code_block || result.code_snippet }}</pre>
              </div>
              <div class="result-field full-width">
                <span class="field-label">切片代码块：</span>
                <pre class="code-snippet">{{ result.code_snippet || result.warn_code_block || result.code_block }}</pre>
              </div>
              <div class="result-field full-width">
                <span class="field-label">上下文代码：</span>
                <pre class="code-snippet context-code">{{ result.context }}</pre>
              </div>
              <div v-if="result.reason" class="result-field full-width">
                <span class="field-label">原因解释：</span>
                <span class="field-value">{{ result.reason }}</span>
              </div>
            </div>
            <div class="result-actions">
              <div class="annotation-section">
                <div class="annotation-label">缺陷标注：</div>
                <el-radio-group
                  :model-value="result.issue_result"
                  @change="(value) => handleMark(result.warn_uuid || result.id, value)"
                  class="annotation-radio-group"
                >
                  <el-radio :label="0" class="annotation-radio">
                    <span class="radio-label">需要修改</span>
                  </el-radio>
                  <el-radio :label="1" class="annotation-radio">
                    <span class="radio-label">无需修改的问题</span>
                  </el-radio>
                  <el-radio :label="2" class="annotation-radio">
                    <span class="radio-label">问题误报</span>
                  </el-radio>
                </el-radio-group>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：规则名称树形结构 -->
      <div class="rule-tree-section">
        <div class="section-label">规则名称分布</div>
        <div class="tree-container">
          <el-tree
            :data="ruleTreeData"
            :props="treeProps"
            node-key="id"
            default-expand-all
            highlight-current
            :current-node-key="selectedRuleNodeId"
            @node-click="handleRuleNodeClick"
            class="rule-tree"
          >
            <template #default="{ node, data }">
              <div class="tree-node-content">
                <span class="tree-node-label">{{ node.label }}</span>
                <span class="tree-node-count">({{ data.count }}个)</span>
                <el-tag
                  v-if="data.ruleName"
                  :type="getRuleNameTagType(data.ruleName)"
                  size="small"
                  class="tree-node-tag"
                >
                  {{ data.ruleName }}
                </el-tag>
              </div>
            </template>
          </el-tree>
          <div v-if="selectedRuleNodeId" class="tree-action">
            <el-button size="small" @click="handleClearRuleFilter">清除筛选</el-button>
          </div>
        </div>
      </div>
    </div>

                <!-- 分页区域 - 仅当任务状态为已完成时显示 -->
                <div
                  v-if="task && task.taskStatus === TASK_STATUS.COMPLETED && filteredResults.length > 0"
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
                <div v-if="task && task.taskStatus !== TASK_STATUS.COMPLETED" class="status-tip-section">
                  <el-alert
                    :title="getStatusTipTitle()"
                    :description="getStatusTipDescription()"
                    type="info"
                    :closable="false"
                    show-icon
                  />
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
    </template>
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
  ElMessage,
  ElSkeleton,
  ElRadioGroup,
  ElRadio,
  ElTree,
  ElTabs,
  ElTabPane
} from 'element-plus'
import { useTaskStore, TASK_STATUS, TASK_STATUS_MAP } from '../stores/task'
import { fetchTaskDetail, fetchScanResults } from '../api/task'

// 类型定义
interface Task {
  taskId: string
  taskName: string
  repoUrl: string
  branch: string
  pathList: string[]
  assistantVersions: string[]
  creator: string
  createTime: string
  taskStatus: string
  codeLanguage: string
  lineNum: number
  productName?: string
  s3Path?: string
  scanResults: any[]
  // 兼容旧数据格式
  id?: string
  status?: string
  scanPaths?: string[]
  language?: string
  codeLines?: number
  product_name?: string
}

interface ScanResult {
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
  reason: string | null
  issue_result: number | null // 0: 需要修改, 1: 无需修改的问题, 2: 问题误报, null: 未标注
  // 兼容旧数据格式
  id?: string
  fileName?: string
  line?: number
  code_block?: string
}

interface FilterForm {
  keyword: string
  ruleName: string
  issueResult: string // '0' | '1' | '2' | 'unmarked' | '' (空字符串表示未选择)
}

interface AnnotationData {
  issue_result: number // 0: 需要修改, 1: 无需修改的问题, 2: 问题误报
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
  needModify: number // 需要修改 (0)
  noNeedModify: number // 无需修改的问题 (1)
  falsePositive: number // 问题误报 (2)
  unmarked: number // 未标注
}

interface RuleTreeNode {
  id: string
  label: string
  ruleName?: string // 叶子节点才有规则名称
  count: number
  children?: RuleTreeNode[]
}

type IssueResult = 0 | 1 | 2 | null // 0: 需要修改, 1: 无需修改的问题, 2: 问题误报, null: 未标注
type TagType = 'success' | 'info' | 'warning' | 'danger'

const router = useRouter()
const route = useRoute()
const taskStore = useTaskStore()

// 任务信息
const task = ref<Task | null>(null)
const scanResults = ref<ScanResult[]>([])
const currentPage = ref<number>(1)
const pageSize = ref<number>(10)
const loading = ref<boolean>(false)
const error = ref<string>('')

// 当前激活的视图
const activeView = ref<string>('info')

// 筛选表单
const filterForm = ref<FilterForm>({
  keyword: '',
  ruleName: '',
  issueResult: ''
})

// 选中的规则树节点ID
const selectedRuleNodeId = ref<string>('')

// 树形结构配置
const treeProps = {
  children: 'children',
  label: 'label'
}

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

// 加载任务详情和扫描结果
const loadTaskData = async (taskId: string): Promise<void> => {
  loading.value = true
  error.value = ''
  
  try {
    // 并行获取任务详情和扫描结果
    const [taskResponse, scanResponse] = await Promise.all([
      fetchTaskDetail(taskId),
      fetchScanResults(taskId)
    ])
    
    // 设置任务详情（兼容旧数据格式）
    if (taskResponse.code === 200 && taskResponse.data) {
      const taskData = taskResponse.data as any
      // 转换为新格式
      task.value = {
        ...taskData,
        taskId: taskData.taskId || taskData.id,
        taskStatus: taskData.taskStatus || taskData.status,
        pathList: taskData.pathList || taskData.scanPaths || [],
        codeLanguage: taskData.codeLanguage || taskData.language || 'Unknown',
        lineNum: taskData.lineNum || (taskData.codeLines ? taskData.codeLines / 10000 : 0),
        productName: taskData.productName || taskData.product_name || '-',
        s3Path: taskData.s3Path || `s3://ai-repo-scan/results/${taskData.taskId || taskData.id}`,
        scanResults: taskData.scanResults || []
      } as Task
    } else {
      throw new Error(taskResponse.message || '获取任务详情失败')
    }
    
    // 如果任务已完成，设置扫描结果（兼容旧数据格式）
    if (task.value.taskStatus === TASK_STATUS.COMPLETED) {
      if (scanResponse.code === 200 && scanResponse.data) {
        const results = scanResponse.data as any[]
        // 转换为新格式
        scanResults.value = results.map((r, idx) => ({
          warn_uuid: r.warn_uuid || r.id || `warn-${idx}`,
          file_name: r.file_name || r.fileName || '',
          rule_name: r.rule_name || '',
          warn_line: r.warn_line || r.line || 0,
          warn_code_block: r.warn_code_block || r.code_block || '',
          code_snippet: r.code_snippet || r.warn_code_block || r.code_block || '',
          context: r.context || '',
          warn: r.warn || '',
          check_function_id: r.check_function_id || '',
          confidence: r.confidence || '0%',
          start_line: r.start_line || r.warn_line || r.line || 0,
          end_line: r.end_line || r.warn_line || r.line || 0,
          func_uuid: r.func_uuid || '',
          index: r.index !== undefined ? r.index : idx + 1,
          reason: r.reason || null,
          issue_result: r.issue_result !== undefined ? r.issue_result : null
        })) as ScanResult[]
      } else {
        throw new Error(scanResponse.message || '获取扫描结果失败')
      }
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载数据失败'
    ElMessage.error(error.value)
    console.error('加载任务数据失败:', err)
  } finally {
    loading.value = false
  }
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
      needModify: 0,
      noNeedModify: 0,
      falsePositive: 0,
      unmarked: 0
    }
  }

  const stats = {
    totalIssues: scanResults.value.length,
    annotated: 0,
    unannotated: 0,
    typeDistribution: {},
    needModify: 0, // 需要修改 (0)
    noNeedModify: 0, // 无需修改的问题 (1)
    falsePositive: 0, // 问题误报 (2)
    unmarked: 0 // 未标注 (null)
  }

  scanResults.value.forEach(result => {
    // 统计标注状态
    const issueResult = result.issue_result
    if (issueResult === 0) {
      stats.needModify++
      stats.annotated++
    } else if (issueResult === 1) {
      stats.noNeedModify++
      stats.annotated++
    } else if (issueResult === 2) {
      stats.falsePositive++
      stats.annotated++
    } else {
      stats.unmarked++
      stats.unannotated++
    }

    // 统计规则名称分布
    const ruleName = result.rule_name || ''
    if (ruleName && !stats.typeDistribution[ruleName]) {
      stats.typeDistribution[ruleName] = 0
    }
    if (ruleName) {
      stats.typeDistribution[ruleName]++
    }
  })

  return stats
})

// 构建规则名称树形结构
const buildRuleTree = (typeDistribution: Record<string, number>): RuleTreeNode[] => {
  const nodeMap = new Map<string, RuleTreeNode>()
  const rootNodes: RuleTreeNode[] = []

  // 遍历所有规则名称，构建树形结构
  Object.entries(typeDistribution).forEach(([ruleName, count]) => {
    // 尝试多种分隔符来解析层级结构
    const separators = ['/', '::', '.', '-', '_']
    let parts: string[] = []
    let separator = ''

    // 找到第一个匹配的分隔符
    for (const sep of separators) {
      if (ruleName.includes(sep)) {
        parts = ruleName.split(sep).filter(p => p.trim())
        separator = sep
        break
      }
    }

    // 如果没有找到分隔符或只有一个部分，将整个规则名称作为叶子节点
    if (parts.length <= 1) {
      const nodeId = `leaf-${ruleName}`
      if (!nodeMap.has(nodeId)) {
        const node: RuleTreeNode = {
          id: nodeId,
          label: ruleName,
          ruleName: ruleName,
          count: 0
        }
        nodeMap.set(nodeId, node)
        rootNodes.push(node)
      }
      const node = nodeMap.get(nodeId)!
      node.count += count
      return
    }

    // 构建树形结构
    let currentPath = ''
    let parentNode: RuleTreeNode | null = null

    parts.forEach((part, index) => {
      const isLeaf = index === parts.length - 1
      currentPath = currentPath ? `${currentPath}${separator}${part}` : part
      const nodeId = `node-${currentPath}`
      
      let node = nodeMap.get(nodeId)
      
      if (!node) {
        node = {
          id: nodeId,
          label: part,
          count: 0,
          children: []
        }
        
        if (isLeaf) {
          node.ruleName = ruleName
        }
        
        nodeMap.set(nodeId, node)

        // 添加到父节点或根节点
        if (parentNode) {
          if (!parentNode.children) {
            parentNode.children = []
          }
          parentNode.children.push(node)
        } else {
          rootNodes.push(node)
        }
      }

      parentNode = node
    })

    // 更新叶子节点的计数
    if (parentNode) {
      parentNode.count += count
    }
  })

  // 递归计算父节点的总数
  const calculateParentCounts = (nodes: RuleTreeNode[]): void => {
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        calculateParentCounts(node.children)
        node.count = node.children.reduce((sum, child) => sum + child.count, 0)
      }
    })
  }

  calculateParentCounts(rootNodes)

  // 按计数降序排序
  const sortNodes = (nodes: RuleTreeNode[]): RuleTreeNode[] => {
    return nodes
      .map(node => ({
        ...node,
        children: node.children ? sortNodes(node.children) : undefined
      }))
      .sort((a, b) => b.count - a.count)
  }

  return sortNodes(rootNodes)
}

// 计算属性：规则名称树形数据
const ruleTreeData = computed<RuleTreeNode[]>(() => {
  if (!scanResults.value.length) return []
  return buildRuleTree(statistics.value.typeDistribution)
})

// 处理规则树节点点击
const handleRuleNodeClick = (data: RuleTreeNode): void => {
  selectedRuleNodeId.value = data.id
  
  if (data.ruleName) {
    // 点击叶子节点，筛选对应的规则
    filterForm.value.ruleName = data.ruleName
    handleFilter()
  } else {
    // 点击父节点，仅选中节点，不进行筛选
    // 用户可以点击子节点来筛选具体的规则
  }
}

// 清除规则筛选
const handleClearRuleFilter = (): void => {
  selectedRuleNodeId.value = ''
  filterForm.value.ruleName = ''
  handleFilter()
}

// 处理下拉框规则选择变化
const handleRuleSelectChange = (): void => {
  // 同步选中树节点
  if (filterForm.value.ruleName) {
    // 查找对应的树节点
    const findNodeByRuleName = (nodes: RuleTreeNode[]): RuleTreeNode | null => {
      for (const node of nodes) {
        if (node.ruleName === filterForm.value.ruleName) {
          return node
        }
        if (node.children) {
          const found = findNodeByRuleName(node.children)
          if (found) return found
        }
      }
      return null
    }
    const node = findNodeByRuleName(ruleTreeData.value)
    if (node) {
      selectedRuleNodeId.value = node.id
    }
  } else {
    selectedRuleNodeId.value = ''
  }
  handleFilter()
}

// 计算属性：筛选后的结果
const filteredResults = computed<ScanResult[]>(() => {
  let results = scanResults.value

  // 关键词搜索（兼容旧数据格式）
  if (filterForm.value.keyword) {
    const keyword = filterForm.value.keyword.toLowerCase()
    results = results.filter(r => {
      const fileName = r.file_name || r.fileName || ''
      const warn = r.warn || ''
      const ruleName = r.rule_name || ''
      return fileName.toLowerCase().includes(keyword) ||
        warn.toLowerCase().includes(keyword) ||
        ruleName.toLowerCase().includes(keyword)
    })
  }

  // 按规则名称筛选
  if (filterForm.value.ruleName) {
    results = results.filter(r => (r.rule_name || '') === filterForm.value.ruleName)
  }

  // 按标注状态筛选
  if (filterForm.value.issueResult === 'unmarked') {
    // 未标注
    results = results.filter(r => r.issue_result === null)
  } else if (filterForm.value.issueResult !== '') {
    // 已标注：需要修改(0)、无需修改的问题(1)、问题误报(2)
    const issueResult = parseInt(filterForm.value.issueResult, 10)
    results = results.filter(r => r.issue_result === issueResult)
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

// 获取标注状态标签类型
const getIssueResultTagType = (issueResult: number): TagType => {
  const typeMap: Record<number, TagType> = {
    0: 'danger', // 需要修改
    1: 'warning', // 无需修改的问题
    2: 'info' // 问题误报
  }
  return typeMap[issueResult] || 'info'
}

// 获取标注状态标签文本
const getIssueResultLabel = (issueResult: number): string => {
  const labelMap: Record<number, string> = {
    0: '需要修改',
    1: '无需修改的问题',
    2: '问题误报'
  }
  return labelMap[issueResult] || '未知'
}

// 标注处理
const handleMark = (warnUuid: string, issueResult: IssueResult): void => {
  const result = scanResults.value.find(r => (r.warn_uuid || r.id) === warnUuid)
  if (result) {
    result.issue_result = issueResult
    
    // 保存到 localStorage
    const taskId = route.params.id as string
    if (taskId) {
      const annotations = loadAnnotationsFromStorage(taskId)
      const uuid = result.warn_uuid || result.id || warnUuid
      if (issueResult === null) {
        // 取消标注，删除记录
        delete annotations[uuid]
        result.reason = null
        ElMessage.success('已取消标注')
      } else {
        // 保存标注
        annotations[uuid] = {
          issue_result: issueResult,
          reason: result.reason || null,
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
        const statusText = getIssueResultLabel(issueResult)
        ElMessage.success(`已标注为：${statusText}`)
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
  const status = task.value.taskStatus || task.value.status
  const statusMap: Record<string, string> = {
    [TASK_STATUS.NOT_STARTED]: '任务未开始',
    [TASK_STATUS.RUNNING]: '任务扫描中',
    [TASK_STATUS.FAILED]: '任务扫描失败'
  }
  return statusMap[status] || '任务状态异常'
}

// 获取状态提示描述
const getStatusTipDescription = (): string => {
  if (!task.value) return ''
  const status = task.value.taskStatus || task.value.status
  const descMap: Record<string, string> = {
    [TASK_STATUS.NOT_STARTED]: '该任务尚未开始扫描，请等待任务启动后查看扫描结果。',
    [TASK_STATUS.RUNNING]: '该任务正在扫描中，请稍候查看扫描结果。',
    [TASK_STATUS.FAILED]: '该任务扫描失败，无法查看扫描结果。'
  }
  return descMap[status] || '无法查看扫描结果。'
}

// 返回任务列表
const handleBack = (): void => {
  router.push('/tasks')
}

// 重试加载
const handleRetry = (): void => {
  const taskId = route.params.id as string
  if (taskId) {
    loadTaskData(taskId)
  }
}

// 组件挂载时加载数据
onMounted(() => {
  const taskId = route.params.id as string
  if (taskId) {
    loadTaskData(taskId)
  } else {
    error.value = '缺少任务ID参数'
    ElMessage.error('缺少任务ID参数')
  }
})
</script>

<style scoped>
.task-detail-page {
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 24px;
}

/* 视图切换标签页样式 */
.view-tabs {
  margin-bottom: 24px;
}

.view-tabs :deep(.el-tabs__header) {
  margin-bottom: 24px;
  background: #ffffff;
  padding: 0 24px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.view-tabs :deep(.el-tabs__item) {
  font-size: 15px;
  font-weight: 500;
  padding: 0 24px;
  height: 48px;
  line-height: 48px;
}

.view-tabs :deep(.el-tabs__item.is-active) {
  color: #3b82f6;
  font-weight: 600;
}

.view-tabs :deep(.el-tabs__active-bar) {
  background-color: #3b82f6;
  height: 3px;
}

.view-content {
  min-height: 400px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.status-tag {
  margin-left: 12px;
}

.task-info-section {
  background: #ffffff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dashboard-section,
.pagination-section,
.status-tip-section {
  background: #ffffff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 结果列表和规则树容器 */
.result-list-container {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  align-items: flex-start;
}

.result-list-section {
  flex: 1;
  background: #ffffff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  min-width: 0; /* 允许flex子元素收缩 */
}

.rule-tree-section {
  width: 320px;
  flex-shrink: 0;
  background: #ffffff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 88px; /* header高度64px + 24px间距 */
  max-height: calc(100vh - 112px); /* 视口高度减去header和间距 */
  display: flex;
  flex-direction: column;
}

.rule-tree-section .section-label {
  margin-bottom: 16px;
  flex-shrink: 0;
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
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e5e7eb;
  font-size: 16px;
}

/* 核心信息卡片 */
.core-info-card {
  background: #ffffff;
  border: 2px solid #3b82f6;
  border-radius: 12px;
  padding: 18px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
  transition: all 0.3s;
}

.core-info-card:hover {
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.15);
}

.core-info-main {
  margin-bottom: 0;
}

.main-info-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  align-items: start;
}

.repo-url-block {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.repo-url-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
  font-weight: 500;
}

.repo-url-value {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #3b82f6;
  text-decoration: none;
  font-size: 14px;
  padding: 8px 12px;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  border-radius: 6px;
  transition: all 0.3s;
  word-break: break-all;
  min-width: 0;
}

.repo-url-value:hover {
  background: #dbeafe;
  border-color: #3b82f6;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.repo-url-value:not(a) {
  cursor: default;
}

.repo-url-value:not(a):hover {
  transform: none;
}

.repo-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.repo-url-text {
  flex: 1;
  min-width: 0;
  overflow-wrap: break-word;
  word-break: break-all;
}


/* 配置信息卡片 */
.config-info-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.config-info-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-color: #d1d5db;
}

.config-header {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.config-title {
  font-size: 15px;
  font-weight: 600;
  color: #374151;
}

.config-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.config-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s;
}

.config-item.full-width {
  grid-column: 1 / -1;
}

.config-item:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.config-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  min-width: 80px;
  flex-shrink: 0;
}

.config-icon {
  font-size: 14px;
}

.config-value {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  color: #374151;
  font-size: 13px;
  word-break: break-all;
}

.path-tag,
.version-tag {
  margin: 0;
}

/* 元信息卡片 */
.meta-info-card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.3s;
}

.meta-item:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.meta-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
}

.meta-icon {
  font-size: 14px;
}

.meta-value {
  font-size: 13px;
  color: #374151;
  font-weight: 500;
}

.dashboard-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

/* 规则树形结构样式 */
.tree-container {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.rule-tree {
  background: transparent;
}

.rule-tree :deep(.el-tree-node__content) {
  height: 36px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.rule-tree :deep(.el-tree-node__content:hover) {
  background-color: #f3f4f6;
}

.rule-tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: #eff6ff;
  border: 1px solid #3b82f6;
}

.tree-node-content {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  flex: 1;
}

.tree-node-label {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
  flex: 1;
}

.tree-node-count {
  font-size: 12px;
  color: #6b7280;
  background: #ffffff;
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  white-space: nowrap;
}

.tree-node-tag {
  margin-left: auto;
}

.tree-action {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
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

.stat-value-text.danger {
  color: #ef4444;
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
  justify-content: flex-start;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.annotation-section {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.annotation-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
}

.annotation-radio-group {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.annotation-radio {
  margin-right: 0;
}

.annotation-radio :deep(.el-radio__label) {
  padding-left: 8px;
  font-size: 14px;
  color: #374151;
}

.annotation-radio :deep(.el-radio__input.is-checked .el-radio__inner) {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

.annotation-radio :deep(.el-radio__input.is-checked + .el-radio__label) {
  color: #3b82f6;
  font-weight: 500;
}

.radio-label {
  user-select: none;
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

.loading-container {
  background: #ffffff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.error-container {
  background: #ffffff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .result-list-container {
    flex-direction: column;
  }

  .rule-tree-section {
    width: 100%;
    position: relative;
    top: 0;
    max-height: none;
  }

  .tree-container {
    max-height: 500px;
  }

  .view-tabs :deep(.el-tabs__header) {
    padding: 0 16px;
  }

  .view-tabs :deep(.el-tabs__item) {
    padding: 0 16px;
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .main-info-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .repo-url-block {
    width: 100%;
  }

  .repo-url-value {
    white-space: normal;
    word-break: break-all;
  }

  .config-content {
    grid-template-columns: 1fr;
  }

  .config-item.full-width {
    grid-column: 1;
  }

  .meta-info-card {
    grid-template-columns: 1fr;
  }

  .header-left {
    flex-direction: column;
    align-items: flex-start;
  }

  .status-tag {
    margin-left: 0;
    margin-top: 8px;
  }

  .annotation-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .annotation-radio-group {
    width: 100%;
    flex-direction: column;
    gap: 12px;
  }

  .result-list-container {
    gap: 16px;
  }

  .result-list-section,
  .rule-tree-section {
    padding: 16px;
  }

  .list-filter {
    flex-direction: column;
    gap: 8px;
  }

  .list-filter .el-input,
  .list-filter .el-select {
    width: 100% !important;
    margin-left: 0 !important;
  }
}
</style>
