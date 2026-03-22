<template>
  <div class="task-detail-page">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated/>
    </div>

    <!-- 错误提示 -->
    <div v-else-if="error" class="error-container">
      <el-alert
          :title="error"
          type="error"
          :closable="false"
          show-icon
      />
      <div class="error-actions">
        <el-button type="primary" @click="handleRetry">
          重试
        </el-button>
        <el-button @click="handleBack">
          返回任务首页
        </el-button>
      </div>
    </div>

    <!-- 未找到任务信息提示 -->
    <div v-else-if="!task" class="error-container">
      <el-alert
          :title="error || '未找到该任务信息'"
          :type="error ? 'error' : 'info'"
          :closable="false"
          show-icon
      />
      <div class="error-actions">
        <el-button type="primary" @click="handleRetry">
          重试
        </el-button>
        <el-button @click="handleBack">
          返回任务首页
        </el-button>
      </div>
    </div>

    <!-- 正常内容 -->
    <template v-else>
      <!-- 页面标题和返回按钮区域 -->
      <div class="page-header">
        <div class="header-left">
          <el-button @click="handleBack">← 返回任务列表</el-button>
          <h1 v-if="task?.taskName">{{ task.taskName }}</h1>
          <h1 v-else>任务详情</h1>
          <el-tag v-if="task?.taskStatus" :type="TASK_STATUS_MAP[task.taskStatus]" size="large" class="status-tag">
            {{ task.taskStatus }}
          </el-tag>
          <el-tag v-else-if="task?.status" :type="TASK_STATUS_MAP[task.status]" size="large" class="status-tag">
            {{ task.status }}
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
                      <a v-if="task && task.repoUrl" :href="task.repoUrl" target="_blank" class="repo-url-value">
                        <span class="repo-icon">🔗</span>
                        <span class="repo-url-text">{{ task.repoUrl }}</span>
                      </a>
                      <div v-else class="repo-url-value">
                        <span class="repo-icon">❌</span>
                        <span class="repo-url-text">未提供地址</span>
                      </div>
                    </div>
                    <div class="repo-url-block">
                      <div class="repo-url-label">代码行数</div>
                      <div class="repo-url-value">
                        <span class="repo-icon">📊</span>
                        <span class="repo-url-text">{{ task?.lineNum || 0 }}万行</span>
                      </div>
                    </div>
                    <div class="repo-url-block">
                      <div class="repo-url-label">代码语言</div>
                      <div class="repo-url-value">
                        <span class="repo-icon">💻</span>
                        <span class="repo-url-text">{{ task?.codeLanguage || '未知' }}</span>
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
                    <div class="config-value">{{ task?.branch || '未设置' }}</div>
                  </div>
                  <div class="config-item">
                    <div class="config-label">
                      <span class="config-icon">🤖</span>
                      <span>助手版本</span>
                    </div>
                    <div class="config-value">
                      <el-tag
                          v-if="task?.assistantVersions && task.assistantVersions.length > 0"
                          v-for="version in task.assistantVersions"
                          :key="version"
                          size="small"
                          type="info"
                          class="version-tag"
                      >
                        {{ version }}
                      </el-tag>
                      <span v-else class="no-version">未设置</span>
                    </div>
                  </div>
                  <div class="config-item ">
                    <div class="config-label">
                      <span class="config-icon">📁</span>
                      <span>扫描路径</span>
                    </div>
                    <div class="config-value">
                      <el-tag v-if="task?.pathList">
                        {{ task.pathList }}
                      </el-tag>
                      <span v-else class="no-s3path">未设置</span>
                    </div>
                  </div>
                  <div class="config-item ">
                    <div class="config-label">
                      <span class="config-icon">📁</span>
                      <span>扫描结果文件</span>
                    </div>
                    <div class="config-value">
                      <el-tag v-if="task?.s3Path">
                        {{ task.s3Path }}
                      </el-tag>
                      <el-upload
                          ref="uploadRef"
                          :auto-upload="false"
                          :limit="1"
                          :on-change="handleFileChange"
                          :on-remove="handleFileRemove"
                          :file-list="fileList"
                          accept=".json"
                      >
                        <template #trigger>
                          <el-button type="primary">选择文件</el-button>
                        </template>
                        <template #tip>
                          <div class="el-upload__tip">
                            支持上传JSON格式的扫描结果文件
                          </div>
                        </template>
                      </el-upload>
                      <el-button v-if="selectedFile" @click="handleSubmit">
                        上传
                      </el-button>
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
                  <div class="meta-value">{{ task?.creator || '未知' }}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">
                    <span class="meta-icon">🕐</span>
                    <span>创建时间</span>
                  </div>
                  <div class="meta-value">{{ task?.createTime || '未知' }}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">
                    <span class="meta-icon">🏢</span>
                    <span>所属部门/开发部</span>
                  </div>
                  <div class="meta-value">{{ task?.dept_name || '-' }}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">
                    <span class="meta-icon">🏭</span>
                    <span>所属PDU</span>
                  </div>
                  <div class="meta-value">{{ task?.pdu_name || '-' }}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">
                    <span class="meta-icon">📦</span>
                    <span>产品名称</span>
                  </div>
                  <div class="meta-value">{{ task?.productName || '-' }}</div>
                </div>
              </div>
            </div>

            <!-- 未找到任务提示 -->
            <div v-else class="empty-section">
              <el-empty description="未找到该任务信息"/>
            </div>

            <!-- 统计看板区域 - 仅当任务状态为已完成时显示 -->
            <div v-if="task && task.taskStatus === TASK_STATUS.COMPLETED && scanResultsList && scanResultsList.length > 0"
                 class="dashboard-section">
              <div class="section-label">任务扫描结果统计看板</div>
              <div class="dashboard-content">
                <!-- 总缺陷数统计卡片 -->
                <div class="stat-summary-card">
                  <div class="summary-icon">📊</div>
                  <div class="summary-content">
                    <div class="summary-label">总缺陷数</div>
                    <div class="summary-value">{{ statistics.totalIssues }}</div>
                    <div class="summary-desc">扫描发现的全部缺陷</div>
                  </div>
                </div>

                <!-- 标注比例环形图 -->
                <div class="chart-card">
                  <div class="chart-title">标注完成度</div>
                  <div ref="annotationRatioChartRef" class="chart-container"></div>
                  <div class="chart-legend">
                    <div v-if="statistics.annotated > 0" class="legend-item">
                      <span class="legend-dot annotated"></span>
                      <span class="legend-text">已标注：{{ statistics.annotated }}</span>
                    </div>
                    <div v-if="statistics.unannotated > 0" class="legend-item">
                      <span class="legend-dot unannotated"></span>
                      <span class="legend-text">未标注：{{ statistics.unannotated }}</span>
                    </div>
                  </div>
                </div>

                <!-- 标注状态分布饼图 -->
                <div class="chart-card">
                  <div class="chart-title">标注状态分布</div>
                  <div ref="annotationStatusChartRef" class="chart-container"></div>
                  <div class="chart-legend">
                    <div v-if="statistics.needModify > 0" class="legend-item">
                      <span class="legend-dot need-modify"></span>
                      <span class="legend-text">需要修改：{{ statistics.needModify }}</span>
                    </div>
                    <div v-if="statistics.noNeedModify > 0" class="legend-item">
                      <span class="legend-dot no-need-modify"></span>
                      <span class="legend-text">无需修改：{{ statistics.noNeedModify }}</span>
                    </div>
                    <div v-if="statistics.falsePositive > 0" class="legend-item">
                      <span class="legend-dot false-positive"></span>
                      <span class="legend-text">问题误报：{{ statistics.falsePositive }}</span>
                    </div>
                    <div v-if="statistics.unmarked > 0" class="legend-item">
                      <span class="legend-dot unmarked"></span>
                      <span class="legend-text">未标注：{{ statistics.unmarked }}</span>
                    </div>
                  </div>
                </div>

                <!-- 规则名称分布柱状图 -->
                <div class="chart-card full-width">
                  <div class="chart-title">规则名称分布（Top 10）</div>
                  <div ref="ruleDistributionChartRef" class="chart-container-large"></div>
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
            <div v-if="task && task.taskStatus === TASK_STATUS.COMPLETED && scanResultsList" class="result-list-container">
              <!-- 左侧：扫描结果列表 -->
              <div class="result-list-section">
                <div class="list-header-with-filter">
                  <div class="section-label">扫描结果列表</div>
                  <!-- 标注结果筛选 -->
                  <div class="annotation-filter">
                    <div class="filter-label">标注结果筛选：</div>
                    <div class="filter-options">
                      <el-select
                          v-model="filterForm.issueResult"
                          @change="handleFilter"
                          placeholder="请选择标注结果"
                          clearable
                          class="annotation-filter-select"
                          style="width: 200px"
                      >
                        <el-option label="全部" value=""/>
                        <el-option label="需要修改" value="0"/>
                        <el-option label="无需修改的问题" value="1"/>
                        <el-option label="问题误报" value="2"/>
                        <el-option label="未标注" value="unmarked"/>
                      </el-select>
                    </div>
                  </div>
                </div>
                <div class="list-content">
                  <div v-if="filteredResults.length === 0" class="empty-results">
                    <el-empty description="暂无扫描结果"/>
                  </div>
                  <div
                      v-for="result in scanResultsList"
                      :key="result.id"
                      class="result-item"
                  >
                    <div class="result-header">
                      <span class="result-title">#{{ result.self_increment_id }}、{{ result.rule_name }}</span>
                      <el-tag
                          v-if="result.issue_result !== null && false"
                          :type="getIssueResultTagType(result.issue_result)"
                          size="small"
                          style="margin-left: 8px"
                      >{{ result.issue_result }}、
                        {{ getIssueResultLabel(result.issue_result) }}
                      </el-tag>
                      <el-tag v-if="result.confidence" size="small" type="info" style="margin-left: 8px">
                        置信度: {{ result.confidence }}
                      </el-tag>
                    </div>
                    <div class="result-body">
                      <div class="result-field">
                        <span class="field-label">文件名称：</span>
                        <!--                        <span class="field-value">{{ result.file_name || result.fileName }}</span>-->
                        <a
                            :href="assembleFileName(result)"
                            target="_blank"
                            class="file-link">{{ assembleFileNameShow(result) }}</a>
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
                        <CodeBlock
                            :code="result.warn_code_block || result.code_block || result.code_snippet || ''"
                            :language="getCodeLanguage()"
                            style="max-height: 200px; overflow-y: auto;"
                        />
                      </div>
                      <div class="result-field full-width">
                        <span class="field-label">切片代码块：</span>
                        <CodeBlock
                            :code="result.code_snippet || result.warn_code_block || result.code_block || ''"
                            :language="getCodeLanguage()"
                            style="max-height: 200px; overflow-y: auto;"
                        />
                      </div>
                      <div class="result-field full-width">
                        <span class="field-label">上下文代码：</span>
                        <CodeBlock
                            :code="result.context || ''"
                            :language="getCodeLanguage()"
                            style="max-height: 200px; overflow-y: auto;"
                        />
                      </div>
                    </div>
                    <div class="result-actions">
                      <div class="annotation-section">
                        <div class="annotation-label">缺陷标注：</div>
                        <el-radio-group
                          :model-value="getAnnotationIssueResult(result)"
                          @update:model-value="(v) => setAnnotationIssueResult(result, v)"
                        >
                          <el-radio :key="0" :value="0" class="option-item">
                            需要修改
                          </el-radio>
                          <el-radio :key="1" :value="1" class="option-item">
                            无需修改的问题
                          </el-radio>
                          <el-radio :key="2" :value="2" class="option-item">
                            问题误报
                          </el-radio>
                        </el-radio-group>
                        <!-- 原因说明输入框 -->
                        <div class="reason-section">
                          <el-input
                              :model-value="getAnnotationReason(result)"
                              @update:model-value="(v) => setAnnotationReason(result, v)"
                              type="textarea"
                              :rows="2"
                              placeholder="请填写选择当前选项的原因（可选）"
                              resize="none"
                          />

                        </div>
                        <el-button @click="saveAnnotation(result)">提交</el-button>
                        <!-- 标注信息显示 -->
                        <div v-if="result.annotation?.annotationStatus" class="annotation-info">
                          <span class="annotation-info-text">
                            <span class="annotation-user">{{ result.annotation?.userId }}</span>
                            <span
                                class="annotation-time">{{
                                result.annotation?.createTime || result.annotation?.updateTime
                              }}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 右侧：规则名称树形结构 -->
              <div class="rule-tree-section">
                <div class="section-label">规则名称分布</div>
                <!-- 搜索框 -->
                <div class="search-box">
                  <el-input
                      v-model="filterForm.keyword"
                      placeholder="搜索文件名称、规则名称或问题说明"
                      clearable
                      @input="handleFilter"
                  >
                    <template #prefix>
                      <span style="color: #909399">🔍</span>
                    </template>
                  </el-input>
                </div>
                <div class="tree-container">
                  <el-tree
                      ref="ruleTreeRef"
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
                  v-model:current-page="pagination.currentPage"
                  v-model:page-size="pagination.pageSize"
                  :page-sizes="[5, 10, 20, 50]"
                  :total="pagination.total"
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
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import * as echarts from 'echarts'
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
import { useTaskStore } from '../../stores/task.js'
import { TASK_STATUS, TASK_STATUS_MAP } from '../../constants/scanTaskConst'
import { userProfileStore } from '../../stores/userProfile'
import { queryTaskDetail, fetchScanResults, saveAnnotation as saveAnnotationApi, getAnnotationStatistics } from '../../api/task'
import CodeBlock from './components/CodeBlock.vue'

// 类型定义
interface Task {
  taskId: string
  taskName: string
  repoUrl: string
  branch: string
  /** 扫描路径，逗号分隔字符串（与接口文档一致） */
  pathList: string
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
  /** 兼容旧数据：曾为数组 */
  scanPaths?: string | string[]
  language?: string
  codeLines?: number
  product_name?: string
}

// 标注信息接口
interface Annotation {
  id?: number // 标注记录id
  warnUuid: string // 告警uuid
  userId: string // 标注用户id，短工号
  issueResult: number | null // 标注结果（0:需要修改，1:无需修改，2:问题误报，null:未标注）
  reason: string | null // 标注原因说明
  annotationStatus?: number // 标注状态（1:已标注）
  createTime?: string // 标注创建时间
  updateTime?: string // 标注更新时间
  userName?: string | null // 用户姓名
  userDepartment?: string | null // 用户部门
  taskId?: string | null // 任务id
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
  annotator?: string // 标注用户（兼容旧字段）
  annotationTime?: string // 标注时间（兼容旧字段）
  annotation: Annotation | null // 标注信息，可能为null
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

// 标注统计信息接口（来自API）
interface AnnotationStatistics {
  taskId: string
  taskName: string
  totalWarnCount: number
  annotatedCount: number
  unannotatedCount: number
  annotationCompletionRate: number
  statusDistribution: Array<{
    statusCode: number
    statusDescription: string
    warnCount: number
    percentage: number
  }>
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
const userInfo = userProfileStore().userInfo

// 任务信息
const task = ref<Task | null>(null)
// 分页扫描结果
const scanResultsList = ref<any[]>([])

/** 将 pathList 规范为逗号分隔字符串（兼容接口 string 与旧数据 string[]） */
function normalizePathListToString(raw: unknown): string {
  if (raw == null) return ''
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x).trim()).filter(Boolean).join(',')
  }
  return String(raw).trim()
}

/** 详情页展示用：按逗号拆分为各路径标签 */
const pathListSegments = computed(() => {
  const s = normalizePathListToString(task.value?.pathList)
  if (!s) return []
  return s.split(',').map((p) => p.trim()).filter(Boolean)
})

let pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

const currentPage = ref<number>(1)
const pageSize = ref<number>(10)
const loading = ref<boolean>(false)
const error = ref<string>('')
const annotationStatistics = ref<AnnotationStatistics | null>(null)

// 当前激活的视图
const activeView = ref<string>('info')

// 筛选表单
const filterForm = ref<FilterForm>({
  keyword: '',
  ruleName: '',
  issueResult: ''
})

// 选中的规则树节点ID
const selectedRuleNodeId = ref<string | null>(null)

// 规则树组件引用
const ruleTreeRef = ref()

// 图表容器引用
const annotationRatioChartRef = ref<HTMLElement | null>(null)
const annotationStatusChartRef = ref<HTMLElement | null>(null)
const ruleDistributionChartRef = ref<HTMLElement | null>(null)

// 图表实例
let annotationRatioChart: echarts.ECharts | null = null
let annotationStatusChart: echarts.ECharts | null = null
let ruleDistributionChart: echarts.ECharts | null = null

// 树形结构配置
const treeProps = {
  children: 'children',
  label: 'label'
}

// 组装文件名及跳转CodeHub链接
const assembleFileName = (result) => {
  if (!task.value || !task.value.repoUrl) {
    return '#'
  }

  let repoHost = task.value.repoUrl.split('?')[0]
  let subProductPathList = repoHost.split('/');
  let subProductPath = subProductPathList[subProductPathList.length - 2]

  if (!subProductPath || !result.file_name) {
    return '#'
  }

  try {
    return repoHost + '?ref=' + task.value.branch + '&filePath=' + result.file_name.split(subProductPath)[1].substring(1) + '&isFile=true#L' + result.warn_line
  } catch (error) {
    console.warn('组装文件链接失败:', error)
    return '#'
  }
}

const assembleFileNameShow = (result) => {
  if (!task.value || !task.value.repoUrl || !result.file_name) {
    return '未知文件'
  }

  try {
    let repoHost = task.value.repoUrl.split('?')[0]
    let subProductPathList = repoHost.split('/');
    let subProductPath = subProductPathList[subProductPathList.length - 2]

    if (!subProductPath) {
      return result.file_name
    }

    return result.file_name.split(subProductPath)[1].substring(1)
  } catch (error) {
    console.warn('组装文件名称显示失败:', error)
    return result.file_name
  }
}

// 加载任务详情和扫描结果
const loadTaskData = async (taskId: string): Promise<void> => {
  loading.value = true
  error.value = ''
  
  try {
    // 获取任务详情（已包含扫描结果）
    const taskResponse = await queryTaskDetail(taskId)
    
    // 设置任务详情（兼容旧数据格式）
    if (taskResponse.code === 200 && taskResponse.data) {
      const resTask = taskResponse.data as any
      
      // 转换为新格式
      const rawScanResults: any[] = Array.isArray(resTask.scanResults)
        ? resTask.scanResults
        : []

      task.value = {
        ...resTask,
        taskId: resTask.taskId || resTask.id,
        taskStatus: resTask.taskStatus || resTask.status,
        pathList: normalizePathListToString(
          resTask.pathList ?? resTask.scanPaths ?? '',
        ),
        codeLanguage: resTask.codeLanguage || resTask.language || 'Unknown',
        lineNum: resTask.lineNum || (resTask.codeLines ? resTask.codeLines / 10000 : 0),
        productName: resTask.productName || resTask.product_name || '-',
        s3Path: resTask.s3Path || `s3://ai-repo-scan/results/${resTask.taskId || resTask.id}`,
        scanResults: rawScanResults,
      } as Task

      // 与列表展示同源：scanResultsList ← filteredResults ← scanResults（由详情接口 scanResults 映射而来）
      scanResultsList.value = rawScanResults
      annotationStatistics.value = null

      // 已完成：始终用接口返回的 scanResults（含空数组）填充，避免 undefined 时沿用上一任务的残留数据
      if (task.value.taskStatus === TASK_STATUS.COMPLETED) {
        scanResultsList.value = rawScanResults.map((item: any) => {
          const result: ScanResult = {
            ...item,
            warn_uuid: item.warn_uuid || item.warnUuid || item.id,
            file_name: item.file_name || item.fileName,
            warn_line: item.warn_line || item.warnLine || item.line,
            warn_code_block: item.warn_code_block || item.warnCodeBlock || item.code_block || item.codeBlock,
            issue_result: item.issue_result ?? item.issueResult ?? null,
            reason: item.reason ?? null,
            // 处理annotation字段：如果存在annotation对象，直接使用；否则根据issue_result等字段创建
            annotation: item.annotation ? {
              id: item.annotation.id,
              warnUuid: item.annotation.warnUuid || item.annotation.warn_uuid || item.warn_uuid,
              userId: item.annotation.userId || item.annotation.user_id || item.annotator || '',
              issueResult: item.annotation.issueResult ?? item.annotation.issue_result ?? item.issue_result ?? null,
              reason: item.annotation.reason ?? item.reason ?? null,
              annotationStatus: item.annotation.annotationStatus ?? item.annotation.annotation_status ?? (item.issue_result !== null && item.issue_result !== undefined ? 1 : undefined),
              createTime: item.annotation.createTime || item.annotation.create_time || item.annotationTime,
              updateTime: item.annotation.updateTime || item.annotation.update_time || item.annotationTime,
              userName: item.annotation.userName || item.annotation.user_name || null,
              userDepartment: item.annotation.userDepartment || item.annotation.user_department || null,
              taskId: item.annotation.taskId || item.annotation.task_id || null
            } : (item.issue_result !== null && item.issue_result !== undefined ? {
              warnUuid: item.warn_uuid || item.warnUuid || item.id || '',
              userId: item.annotator || item.annotation?.userId || '',
              issueResult: item.issue_result ?? item.issueResult ?? null,
              reason: item.reason ?? null,
              annotationStatus: 1,
              createTime: item.annotationTime || item.annotation?.createTime,
              updateTime: item.annotationTime || item.annotation?.updateTime
            } : null)
          }
          return result
        }) as ScanResult[]
        
        // 数据加载完成后，延迟初始化图表（确保 DOM 已渲染）
        setTimeout(() => {
          updateAllCharts()
        }, 300)
        
        // 获取标注统计信息
        try {
          const statisticsResponse = await getAnnotationStatistics(taskId)
          if (statisticsResponse.code === 200 && statisticsResponse.data) {
            annotationStatistics.value = statisticsResponse.data
          }
        } catch (err) {
          console.warn('获取标注统计信息失败:', err)
          // 不阻塞主流程，使用本地计算的统计数据
        }
      }
    } else {
      throw new Error(taskResponse.message || '获取任务详情失败')
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
  if (!scanResultsList.value.length) {
    return []
  }
  const names = new Set(scanResultsList.value.map(r => r.rule_name))
  return Array.from(names)
})

// 计算属性：统计信息
const statistics = computed<Statistics>(() => {
  if (!scanResultsList.value.length) {
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
    totalIssues: scanResultsList.value.length,
    annotated: 0,
    unannotated: 0,
    typeDistribution: {},
    needModify: 0, // 需要修改 (0)
    noNeedModify: 0, // 无需修改的问题 (1)
    falsePositive: 0, // 问题误报 (2)
    unmarked: 0 // 未标注 (null)
  }

  scanResultsList.value.forEach(result => {
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
  if (!scanResultsList.value.length) {
    return []
  }
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
  selectedRuleNodeId.value = null
  filterForm.value.ruleName = ''
  // 清除树形组件的选中状态
  if (ruleTreeRef.value) {
    ruleTreeRef.value.setCurrentKey(null)
  }
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
          if (found) {
            return found
          }
        }
      }
      return null
    }
    const node = findNodeByRuleName(ruleTreeData.value)
    if (node) {
      selectedRuleNodeId.value = node.id
    }
  } else {
    selectedRuleNodeId.value = null
    // 清除树形组件的选中状态
    if (ruleTreeRef.value) {
      ruleTreeRef.value.setCurrentKey(null)
    }
  }
  handleFilter()
}

// 计算属性：筛选后的结果
const filteredResults = computed<ScanResult[]>(() => {
  let results = scanResultsList.value

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

// 获取或初始化annotation对象
const getOrInitAnnotation = (result: ScanResult): Annotation => {
  if (!result.annotation) {
    result.annotation = {
      warnUuid: result.warn_uuid || result.id || '',
      userId: userInfo?.w3Id || '',
      issueResult: result.issue_result ?? null,
      reason: result.reason ?? null
    }
  }
  return result.annotation
}

// 获取annotation的issueResult（用于v-model）
const getAnnotationIssueResult = (result: ScanResult): number | null => {
  const annotation = getOrInitAnnotation(result)
  return annotation.issueResult
}

// 设置annotation的issueResult（兼容 el-radio-group 等组件的 update 值类型）
const setAnnotationIssueResult = (result: ScanResult, value: unknown): void => {
  const annotation = getOrInitAnnotation(result)
  let parsed: number | null = null
  if (value === null || value === undefined || value === '') {
    parsed = null
  } else if (typeof value === 'number') {
    parsed = Number.isFinite(value) ? value : null
  } else if (typeof value === 'string') {
    const n = Number(value)
    parsed = Number.isFinite(n) ? n : null
  }
  annotation.issueResult = parsed as IssueResult
  result.issue_result = parsed as IssueResult
}

// 获取annotation的reason（用于v-model）
const getAnnotationReason = (result: ScanResult): string => {
  const annotation = getOrInitAnnotation(result)
  return annotation.reason || ''
}

// 设置annotation的reason
const setAnnotationReason = (result: ScanResult, value: string): void => {
  const annotation = getOrInitAnnotation(result)
  annotation.reason = value || null
  // 同步到reason字段（兼容旧字段）
  result.reason = value || null
}

// 标注处理（提交标注）
const submitAnnotation = async (result: ScanResult): Promise<void> => {
  const annotation = getOrInitAnnotation(result)
  const issueResult = annotation.issueResult
  
  if (issueResult === null) {
    ElMessage.warning('请先选择标注结果')
    return
  }
  
  await saveAnnotationHandler(result, issueResult)
}

// 标注处理（内部函数）
const saveAnnotationHandler = async (result: ScanResult, value: IssueResult): Promise<void> => {
  const taskId = route.params.id as string
  if (!taskId) {
    ElMessage.error('缺少任务ID')
    return
  }

  const uuid = result.warn_uuid || result.id
  if (!uuid) {
    ElMessage.error('缺少警告UUID')
    return
  }

  try {
    const currentUser = userInfo?.w3Id || userInfo?.nameCn || taskStore.currentUser.value || '当前用户'
    const annotationTime = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/\//g, '-')
    
    if (value === null) {
      // 取消标注
      await saveAnnotationApi(taskId, uuid, null, '', '')
      
      // 更新 result 对象的标注信息
      result.issue_result = null
      result.reason = null
      result.annotator = undefined
      result.annotationTime = undefined
      
      // 清除annotation对象
      if (result.annotation) {
        result.annotation.issueResult = null
        result.annotation.reason = null
        result.annotation.annotationStatus = undefined
      }
      
      ElMessage.success('已取消标注')
    } else {
      // 保存标注
      await saveAnnotationApi(taskId, uuid, value, currentUser, annotationTime)
      
      // 更新 result 对象的标注信息
      result.issue_result = value
      result.reason = result.annotation?.reason || null
      result.annotator = currentUser
      result.annotationTime = annotationTime
      
      // 更新或创建annotation对象
      const annotation = getOrInitAnnotation(result)
      annotation.issueResult = value
      annotation.userId = currentUser
      annotation.reason = annotation.reason || null
      annotation.annotationStatus = 1
      annotation.createTime = annotation.createTime || annotationTime
      annotation.updateTime = annotationTime
      
      const statusText = getIssueResultLabel(value)
      ElMessage.success(`已标注为：${statusText}`)
    }
  } catch (error) {
    console.error('保存标注失败:', error)
    ElMessage.error('保存标注失败')
  }
}

// 筛选处理
const handleFilter = (): void => {
  pagination.value.currentPage = 1
}

// 分页大小改变
const handleSizeChange = (size: number): void => {
  pagination.value.pageSize = size
  pagination.value.currentPage = 1
}

// 当前页改变
const handleCurrentChange = (page: number): void => {
  pagination.value.currentPage = page
  if (task.value) {
    loadTaskData(route.params.id as string)
  }
}

// 获取状态提示标题
const getStatusTipTitle = (): string => {
  if (!task.value) {
    return ''
  }
  const status = task.value.taskStatus || task.value.status
  if (!status) {
    return '任务状态异常'
  }
  const statusMap: Record<string, string> = {
    [TASK_STATUS.NOT_STARTED]: '任务未开始',
    [TASK_STATUS.RUNNING]: '任务扫描中',
    [TASK_STATUS.FAILED]: '任务扫描失败'
  }
  return statusMap[status] || '任务状态异常'
}

// 获取状态提示描述
const getStatusTipDescription = (): string => {
  if (!task.value) {
    return ''
  }
  const status = task.value.taskStatus || task.value.status
  if (!status) {
    return '无法查看扫描结果。'
  }
  const descMap: Record<string, string> = {
    [TASK_STATUS.NOT_STARTED]: '该任务尚未开始扫描，请等待任务启动后查看扫描结果。',
    [TASK_STATUS.RUNNING]: '该任务正在扫描中，请稍候查看扫描结果。',
    [TASK_STATUS.FAILED]: '该任务扫描失败，无法查看扫描结果。'
  }
  return descMap[status] || '无法查看扫描结果。'
}

// 获取代码语言类型（映射到 highlight.js 支持的语言）
const getCodeLanguage = (): string => {
  if (!task.value || !task.value.codeLanguage) {
    return 'cpp' // 默认使用 cpp
  }
  
  const languageMap: Record<string, string> = {
    'C++': 'cpp',
    'C': 'c',
    'Java': 'java',
    'Python': 'python',
    'JavaScript': 'javascript',
    'TypeScript': 'typescript',
    'Go': 'go',
    'Rust': 'rust',
    'PHP': 'php',
    'Ruby': 'ruby',
    'C#': 'csharp',
    'cpp': 'cpp',
    'c': 'c',
    'java': 'java',
    'python': 'python',
    'javascript': 'javascript',
    'typescript': 'typescript',
    'go': 'go',
  }
  
  const normalizedLang = task.value.codeLanguage.trim()
  return languageMap[normalizedLang] || 'cpp' // 如果找不到映射，默认使用 cpp
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

// 初始化标注比例环形图
const initAnnotationRatioChart = (): void => {
  if (!annotationRatioChartRef.value) {
    console.warn('annotationRatioChartRef 未找到')
    return
  }
  
  if (annotationRatioChart) {
    annotationRatioChart.dispose()
  }
  
  try {
    annotationRatioChart = echarts.init(annotationRatioChartRef.value)
    
    // 优先使用接口返回的统计数据
    const annotated = annotationStatistics.value?.annotatedCount || statistics.value.annotated || 0
    const unannotated = annotationStatistics.value?.unannotatedCount || statistics.value.unannotated || 0
    
    // 过滤掉值为0的数据项
    const chartData = []
    if (annotated > 0) {
      chartData.push({
        value: annotated,
        name: '已标注',
        itemStyle: { color: '#10b981' }  // 绿色系，表示完成
      })
    }
    if (unannotated > 0) {
      chartData.push({
        value: unannotated,
        name: '未标注',
        itemStyle: { color: '#6b7280' }  // 深灰色，对比明显
      })
    }
    
    // 如果数据都为0，显示空状态
    if (chartData.length === 0) {
      annotationRatioChart.setOption({
        graphic: {
          type: 'text',
          left: 'center',
          top: 'center',
          style: {
            text: '暂无数据',
            fontSize: 14,
            fill: '#9ca3af'
          }
        }
      })
      return
    }
    
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      series: [
        {
          name: '标注完成度',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            formatter: '{d}%'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold'
            }
          },
          data: chartData
        }
      ]
    }
    
    annotationRatioChart.setOption(option)
    console.log('标注比例环形图初始化成功')
  } catch (error) {
    console.error('初始化标注比例环形图失败:', error)
  }
}

// 初始化标注状态分布饼图
const initAnnotationStatusChart = (): void => {
  if (!annotationStatusChartRef.value) {
    console.warn('annotationStatusChartRef 未找到')
    return
  }
  
  if (annotationStatusChart) {
    annotationStatusChart.dispose()
  }
  
  try {
    annotationStatusChart = echarts.init(annotationStatusChartRef.value)
    
    // 接口的 statusDistribution 只包含"已标注"的汇总信息
    // 各个标注结果（需要修改、无需修改、问题误报）需要从本地数据计算
    // 未标注数优先使用接口返回的数据
    const needModify = statistics.value.needModify || 0
    const noNeedModify = statistics.value.noNeedModify || 0
    const falsePositive = statistics.value.falsePositive || 0
    const unmarked = annotationStatistics.value?.unannotatedCount || statistics.value.unmarked || 0
    
    // 过滤掉值为0的数据项
    const chartData = []
    if (needModify > 0) {
      chartData.push({
        value: needModify,
        name: '需要修改',
        itemStyle: { color: '#ef4444' }  // 鲜明的红色，对比明显
      })
    }
    if (noNeedModify > 0) {
      chartData.push({
        value: noNeedModify,
        name: '无需修改',
        itemStyle: { color: '#f59e0b' }  // 鲜明的橙色，对比明显
      })
    }
    if (falsePositive > 0) {
      chartData.push({
        value: falsePositive,
        name: '问题误报',
        itemStyle: { color: '#3b82f6' }  // 鲜明的蓝色，对比明显
      })
    }
    if (unmarked > 0) {
      chartData.push({
        value: unmarked,
        name: '未标注',
        itemStyle: { color: '#64748b' }  // 深灰蓝色，对比明显
      })
    }
    
    // 如果数据都为0，显示空状态
    if (chartData.length === 0) {
      annotationStatusChart.setOption({
        graphic: {
          type: 'text',
          left: 'center',
          top: 'center',
          style: {
            text: '暂无数据',
            fontSize: 14,
            fill: '#9ca3af'
          }
        }
      })
      return
    }
    
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        show: false
      },
      series: [
        {
          name: '标注状态',
          type: 'pie',
          radius: '65%',
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            formatter: '{b}\n{d}%'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold'
            }
          },
          data: chartData
        }
      ]
    }
    
    annotationStatusChart.setOption(option)
    console.log('标注状态分布饼图初始化成功')
  } catch (error) {
    console.error('初始化标注状态分布饼图失败:', error)
  }
}

// 初始化规则名称分布柱状图
const initRuleDistributionChart = (): void => {
  if (!ruleDistributionChartRef.value) {
    console.warn('ruleDistributionChartRef 未找到')
    return
  }
  
  if (ruleDistributionChart) {
    ruleDistributionChart.dispose()
  }
  
  try {
    ruleDistributionChart = echarts.init(ruleDistributionChartRef.value)
    
    // 获取 Top 10 规则
    const ruleEntries = Object.entries(statistics.value.typeDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
    
    // 如果没有规则数据，显示空状态
    if (ruleEntries.length === 0) {
      ruleDistributionChart.setOption({
        graphic: {
          type: 'text',
          left: 'center',
          top: 'center',
          style: {
            text: '暂无数据',
            fontSize: 14,
            fill: '#9ca3af'
          }
        }
      })
      return
    }
    
    const ruleNames = ruleEntries.map(([name]) => {
      // 如果名称太长，截断并添加省略号
      return name.length > 20 ? name.substring(0, 20) + '...' : name
    })
    const ruleCounts = ruleEntries.map(([, count]) => count)
    
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params: any) => {
          const param = params[0]
          const fullName = ruleEntries[param.dataIndex][0]
          return `${fullName}<br/>数量: ${param.value}`
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        axisLabel: {
          color: '#6b7280'
        },
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        }
      },
      yAxis: {
        type: 'category',
        data: ruleNames,
        axisLabel: {
          color: '#6b7280',
          fontSize: 12
        },
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        }
      },
      series: [
        {
          name: '缺陷数量',
          type: 'bar',
          data: ruleCounts,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#60a5fa' }
            ]),
            borderRadius: [0, 4, 4, 0]
          },
          label: {
            show: true,
            position: 'right',
            color: '#374151',
            fontSize: 12
          }
        }
      ]
    }
    
    ruleDistributionChart.setOption(option)
    console.log('规则名称分布柱状图初始化成功', { count: ruleEntries.length })
  } catch (error) {
    console.error('初始化规则名称分布柱状图失败:', error)
  }
}

// 窗口大小变化处理函数
const handleResize = (): void => {
  annotationRatioChart?.resize()
  annotationStatusChart?.resize()
  ruleDistributionChart?.resize()
}

// 更新所有图表
const updateAllCharts = async (): Promise<void> => {
  // 等待 DOM 更新
  await nextTick()
  
  // 再次等待，确保 v-if 条件渲染的 DOM 元素已经创建
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // 检查统计数据
  if (statistics.value.totalIssues === 0) {
    console.log('统计数据为空，跳过图表初始化')
    return
  }
  
  // 检查 DOM 元素是否存在
  if (!annotationRatioChartRef.value || !annotationStatusChartRef.value || !ruleDistributionChartRef.value) {
    console.warn('图表容器 DOM 元素未找到，延迟重试')
    // 如果 DOM 元素还没准备好，延迟重试
    setTimeout(() => {
      updateAllCharts()
    }, 200)
    return
  }
  
  console.log('开始初始化图表', {
    totalIssues: statistics.value.totalIssues,
    annotated: statistics.value.annotated,
    unannotated: statistics.value.unannotated
  })
  
  try {
    initAnnotationRatioChart()
    initAnnotationStatusChart()
    initRuleDistributionChart()
    
    // 监听窗口大小变化，自动调整图表大小（避免重复添加）
    if (!window.hasOwnProperty('_chartResizeHandlerAdded')) {
      window.addEventListener('resize', handleResize)
      ;(window as any)._chartResizeHandlerAdded = true
    }
  } catch (error) {
    console.error('图表初始化失败:', error)
  }
}

// 监听统计数据变化，更新图表
watch(
  () => [statistics.value, scanResultsList.value.length, annotationStatistics.value],
  () => {
    if (task.value?.taskStatus === TASK_STATUS.COMPLETED && scanResultsList.value.length > 0) {
      console.log('统计数据变化，更新图表')
      updateAllCharts()
    }
  },
  { deep: true, immediate: false }
)

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

// 组件卸载时清理图表实例
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if ((window as any)._chartResizeHandlerAdded) {
    delete (window as any)._chartResizeHandlerAdded
  }
  
  if (annotationRatioChart) {
    annotationRatioChart.dispose()
    annotationRatioChart = null
  }
  if (annotationStatusChart) {
    annotationStatusChart.dispose()
    annotationStatusChart = null
  }
  if (ruleDistributionChart) {
    ruleDistributionChart.dispose()
    ruleDistributionChart = null
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
  flex-direction: column;
}

.result-list-section {
  flex: 1;
  background: #ffffff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  min-width: 0; /* 允许flex子元素收缩 */
  margin-right: 344px; /* 规则树宽度320px + 间距24px */
}

.rule-tree-section {
  width: 320px;
  flex-shrink: 0;
  background: #ffffff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: fixed;
  right: 24px; /* 距离右侧24px */
  top: 220px; /* header高度64px + 24px间距 */
  max-height: calc(100vh - 112px); /* 视口高度减去header和间距 */
  display: flex;
  flex-direction: column;
  z-index: 100;
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
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.dashboard-content .full-width {
  grid-column: 1 / -1;
}

/* 统计摘要卡片 */
.stat-summary-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 24px;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transition: all 0.3s;
}

.stat-summary-card.completion-rate-card {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.stat-summary-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.summary-icon {
  font-size: 48px;
  line-height: 1;
}

.summary-content {
  flex: 1;
}

.summary-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 4px;
  line-height: 1.2;
}

.summary-desc {
  font-size: 12px;
  opacity: 0.8;
}

/* 图表卡片 */
.chart-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.chart-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #d1d5db;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f3f4f6;
}

.chart-container {
  width: 100%;
  height: 300px;
  min-height: 300px;
}

.chart-container-large {
  width: 100%;
  height: 400px;
  min-height: 400px;
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-dot.annotated {
  background-color: #10b981;  /* 绿色，与标注完成度图表一致 */
}

.legend-dot.unannotated {
  background-color: #6b7280;  /* 深灰色，与标注完成度图表一致 */
}

.legend-dot.need-modify {
  background-color: #ef4444;  /* 鲜明的红色，与标注状态分布图表一致 */
}

.legend-dot.no-need-modify {
  background-color: #f59e0b;  /* 鲜明的橙色，与标注状态分布图表一致 */
}

.legend-dot.false-positive {
  background-color: #3b82f6;  /* 鲜明的蓝色，与标注状态分布图表一致 */
}

.legend-dot.unmarked {
  background-color: #64748b;  /* 深灰蓝色，与标注状态分布图表一致 */
}

.legend-text {
  color: #374151;
  font-weight: 500;
}

/* 规则树形结构样式 */
.search-box {
  margin-bottom: 16px;
}

.search-box :deep(.el-input__wrapper) {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

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

.list-header-with-filter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  gap: 24px;
  flex-wrap: wrap;
}

.annotation-filter {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
}

.filter-options {
  display: flex;
  align-items: center;
}

.annotation-filter-select :deep(.el-input__wrapper) {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.annotation-filter-group {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-radio {
  margin-right: 0;
}

.filter-radio :deep(.el-radio__label) {
  padding-left: 8px;
  display: flex;
  align-items: center;
}

.filter-radio :deep(.el-radio__input.is-checked .el-radio__inner) {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

.filter-radio :deep(.el-radio__input.is-checked + .el-radio__label) {
  color: #3b82f6;
  font-weight: 500;
}

.filter-tag {
  margin: 0;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-tag:hover {
  opacity: 0.8;
  transform: scale(1.05);
}

.radio-label {
  font-size: 14px;
  color: #374151;
  user-select: none;
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
  flex-wrap: wrap;
  position: relative;
}

.annotation-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
}

.annotation-info {
  margin-left: auto;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  order: 999;
}

.annotation-info-text {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #9ca3af;
  padding: 2px 6px;
  background: #f9fafb;
  border-radius: 3px;
  white-space: nowrap;
  border: 1px solid #e5e7eb;
}

.annotation-user {
  color: #6b7280;
  font-weight: 400;
}

.annotation-time {
  color: #9ca3af;
  font-size: 10px;
}

.annotation-info-text::before {
  content: '👤';
  margin-right: 2px;
  font-size: 10px;
  opacity: 0.6;
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

.reason-section {
  display: flex;

  gap: 8px;
  width: 600px;
  margin-top: 8px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .result-list-section {
    margin-right: 0;
  }

  .result-list-container {
    flex-direction: column;
  }

  .rule-tree-section {
    width: 100%;
    position: relative;
    right: auto;
    top: 0;
    max-height: none;
    z-index: auto;
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

  .annotation-info {
    margin-left: auto;
    width: auto;
    align-self: flex-end;
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

  .list-header-with-filter {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .annotation-filter {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .filter-options {
    width: 100%;
  }

  .annotation-filter-select {
    width: 100% !important;
  }

  .annotation-filter-group {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .search-box {
    width: 100%;
  }

  /* 图表响应式样式 */
  .dashboard-content {
    grid-template-columns: 1fr;
  }

  .stat-summary-card {
    flex-direction: column;
    text-align: center;
  }

  .summary-icon {
    font-size: 40px;
  }

  .summary-value {
    font-size: 32px;
  }

  .chart-container {
    height: 250px;
    min-height: 250px;
  }

  .chart-container-large {
    height: 300px;
    min-height: 300px;
  }

  .chart-legend {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

@media (max-width: 1200px) {
  .dashboard-content {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }
}
</style>
