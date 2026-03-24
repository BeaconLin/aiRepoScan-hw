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
          <el-tag v-if="task?.taskStatus" :type="taskStatusToElTagType(task.taskStatus)" size="large" class="status-tag">
            {{ task.taskStatus }}
          </el-tag>
          <el-tag v-else-if="task?.status" :type="taskStatusToElTagType(task.status)" size="large" class="status-tag">
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
              <div class="task-info-cards-row">
                <el-card class="task-detail-field-card" shadow="never">
                  <template #header>
                    <span class="task-detail-card-title">任务基本信息</span>
                  </template>
                  <div class="task-detail-fields">
                    <div class="task-detail-field-line">
                      <span>代码仓地址：</span>
                      <a
                          v-if="task.repoUrl"
                          :href="task.repoUrl"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="task-detail-link"
                      >{{ task.repoUrl }}</a>
                      <span v-else class="task-detail-muted">未提供地址</span>
                    </div>
                    <div class="task-detail-field-line">
                      <span>代码行数：</span><span>{{ task.lineNum ?? '--' }}k</span>
                    </div>
                    <div class="task-detail-field-line">
                      <span>代码语言：</span><span>{{ task.codeLanguage || '未知' }}</span>
                    </div>
                    <div class="task-detail-field-line">
                      <span>创建人：</span><span>{{ formatTaskCreatorDisplay(task) }}</span>
                    </div>
                    <div class="task-detail-field-line">
                      <span>创建时间：</span><span>{{ task.createTime || '未知' }}</span>
                    </div>
                    <div class="task-detail-field-line">
                      <span>所属部门/开发部：</span><span>{{ task.dept_name || '-' }}</span>
                    </div>
                    <div class="task-detail-field-line">
                      <span>所属PDU：</span><span>{{ task.pdu_name || '-' }}</span>
                    </div>
                    <div class="task-detail-field-line">
                      <span>产品名称：</span><span>{{ task.productName || '-' }}</span>
                    </div>
                    <div v-if="task.warnCount != null" class="task-detail-field-line">
                      <span>告警总数：</span><span>{{ task.warnCount }}</span>
                    </div>
                  </div>
                </el-card>

                <el-card class="task-detail-field-card" shadow="never">
                  <template #header>
                    <span class="task-detail-card-title">扫描设置</span>
                  </template>
                  <div class="task-detail-fields">
                    <div class="task-detail-field-line">
                      <span>扫描分支：</span><span>{{ task.branch || '未设置' }}</span>
                    </div>
                    <div class="task-detail-field-line">
                      <span>助手版本：</span><span>{{ assistantVersionsDisplay }}</span>
                    </div>
                    <div class="task-detail-field-line">
                      <span>扫描路径：</span><span>{{ pathListDisplay }}</span>
                    </div>
                    <div class="task-detail-field-line task-detail-field-line--scan-file">
                      <div class="task-detail-scan-file-main">
                        <div class="task-detail-scan-grid">
                          <span class="task-detail-scan-label">扫描结果文件：</span>
                          <span
                              class="task-detail-scan-file-value"
                              :title="scanResultFileDisplay || undefined"
                          >{{ scanResultFileDisplay || '—' }}</span>
                          <span class="task-detail-scan-hint">仅支持 JSON 格式；上传后将替换当前任务关联的扫描结果文件。</span>
                        </div>
                      </div>
                      <el-upload
                          ref="scanResultUploadRef"
                          class="task-detail-scan-upload"
                          :auto-upload="false"
                          :show-file-list="false"
                          :limit="1"
                          accept=".json"
                          :on-change="handleScanResultFileChange"
                      >
                        <template #trigger>
                          <el-button type="primary" size="small">{{ scanResultFileButtonText }}</el-button>
                        </template>
                      </el-upload>
                    </div>
                  </div>
                </el-card>
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

                <!-- 标注完成度（数字指标） -->
                <div class="chart-card metric-panel">
                  <div class="chart-title">标注完成度</div>
                  <div class="metric-panel-body">
                    <div class="metric-hero">
                      <span class="metric-hero-value">{{ annotationCompletionRatePct }}</span>
                      <span class="metric-hero-unit">%</span>
                      <div class="metric-hero-caption">标注完成率</div>
                    </div>
                    <div class="metric-split">
                      <div class="metric-cell metric-cell--annotated">
                        <div class="metric-cell-value">{{ annotationRatioCounts.annotated }}</div>
                        <div class="metric-cell-label">已标注（条）</div>
                        <div class="metric-cell-sub">占 {{ annotationCompletionPct.annotated }}%</div>
                      </div>
                      <div class="metric-cell metric-cell--unannotated">
                        <div class="metric-cell-value">{{ annotationRatioCounts.unannotated }}</div>
                        <div class="metric-cell-label">未标注（条）</div>
                        <div class="metric-cell-sub">占 {{ annotationCompletionPct.unannotated }}%</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 标注状态分布（数字指标） -->
                <div class="chart-card metric-panel">
                  <div class="chart-title">标注状态分布</div>
                  <div class="metric-grid-4">
                    <div class="metric-cell metric-cell--need-modify">
                      <div class="metric-cell-value">{{ statistics.needModify }}</div>
                      <div class="metric-cell-label">需要修改</div>
                      <div class="metric-cell-sub">{{ annotationStatusPct.needModify }}%</div>
                    </div>
                    <div class="metric-cell metric-cell--no-need-modify">
                      <div class="metric-cell-value">{{ statistics.noNeedModify }}</div>
                      <div class="metric-cell-label">无需修改</div>
                      <div class="metric-cell-sub">{{ annotationStatusPct.noNeedModify }}%</div>
                    </div>
                    <div class="metric-cell metric-cell--false-positive">
                      <div class="metric-cell-value">{{ statistics.falsePositive }}</div>
                      <div class="metric-cell-label">问题误报</div>
                      <div class="metric-cell-sub">{{ annotationStatusPct.falsePositive }}%</div>
                    </div>
                    <div class="metric-cell metric-cell--unmarked">
                      <div class="metric-cell-value">{{ annotationStatusUnmarkedCount }}</div>
                      <div class="metric-cell-label">未标注</div>
                      <div class="metric-cell-sub">{{ annotationStatusPct.unmarked }}%</div>
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
          <div
              class="view-content"
              :class="{
                'view-content--with-fixed-pagination':
                  task && task.taskStatus === TASK_STATUS.COMPLETED && pagination.total > 0
              }"
          >
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
                  <div v-if="filteredScanResultsList.length === 0" class="empty-results">
                    <el-empty description="暂无扫描结果"/>
                  </div>
                  <!-- key 使用「筛选后列表」中的全局下标，避免多条告警共享同一 warn_uuid/id 时 Vue 复用节点导致「同一规则只显示一条」 -->
                  <div
                      v-for="(result, rIdx) in pagedScanResultsList"
                      :key="(pagination.currentPage - 1) * pagination.pageSize + rIdx"
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
                        <el-button @click="submitAnnotation(result)">提交</el-button>
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

            <!-- 分页区域 - 仅当任务状态为已完成时显示；固定底部悬浮 -->
            <div
                v-if="task && task.taskStatus === TASK_STATUS.COMPLETED && pagination.total > 0"
                class="pagination-section pagination-bar-fixed"
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
  ElMessageBox,
  ElSkeleton,
  ElRadioGroup, 
  ElRadio,
  ElTree,
  ElTabs,
  ElTabPane,
  ElCard,
  ElUpload,
} from 'element-plus'
import type { UploadFile, UploadFiles } from 'element-plus'
import { TASK_STATUS, TASK_STATUS_MAP } from '@/constants/scanTaskConst'
import { useProfileStore } from '@/stores/userProfile'

import {
  getTaskInfo,
  getTaskScanResults,
  uploadScanResultFile,
  saveAnnotationApi,
  getAnnotationStatistics,
  type TaskScanResultApiDocRow,
} from '@/api/task'
import type { SaveAnnotationReqBody, TaskDetailPaginationInfo } from '@/api/types/saveAnnotation'
import CodeBlock from '@/views/taskManagement/components/CodeBlock.vue'

/** `el-tag` 的 type 需为字面量联合，不能为宽泛的 `string` */
type ElTagType = 'success' | 'info' | 'warning' | 'danger'

function taskStatusToElTagType(status: string | undefined): ElTagType {
  if (!status) return 'info'
  const v = TASK_STATUS_MAP[status as keyof typeof TASK_STATUS_MAP]
  if (v === 'success' || v === 'info' || v === 'warning' || v === 'danger') {
    return v
  }
  return 'info'
}

/**
 * 仅采用接口/存储中的 nameCn；若无则留空，创建人由 formatTaskCreatorDisplay 只展示 creator。
 */
function resolveTaskCreatorNameCn(explicitNameCn?: string | null): string {
  return explicitNameCn?.trim() || ''
}

/** 任务详情创建人展示：「中文名 短工号」 */
function formatTaskCreatorDisplay(task: { creator?: string; nameCn?: string }): string {
  const w3 = (task.creator || '').trim()
  const cn = (task.nameCn || '').trim()
  if (cn && w3) return `${cn} ${w3}`
  return w3 || '--'
}

// 类型定义
interface Task {
  taskId: string
  taskName: string
  repoUrl: string
  branch: string
  /** 扫描路径，逗号分隔字符串（与接口文档一致） */
  pathList: string
  /** 接口多为英文逗号分隔字符串；兼容 string[] */
  assistantVersions?: string | string[]
  creator: string
  createTime: string
  taskStatus: string
  codeLanguage: string
  lineNum: number
  productName?: string
  dept_name?: string
  pdu_name?: string
  s3Path?: string
  /** 接口 getTaskInfo 返回的 warnCount，组装后用于展示 */
  warnCount?: number | null
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

/** 0: 需要修改, 1: 无需修改的问题, 2: 问题误报, null: 未标注 */
type IssueResult = 0 | 1 | 2 | null

// 标注信息接口
interface Annotation {
  id?: number // 标注记录id
  warnUuid: string // 告警uuid
  userId: string // 标注用户id，短工号
  issueResult: IssueResult
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
  /** 列表展示序号 */
  self_increment_id?: number
  reason: string | null
  issue_result: IssueResult
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

/** 与接口文档 2.1 一致：YYYY-MM-DD HH:mm:ss */
function formatAnnotationTimeForApi(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

type TagType = 'success' | 'info' | 'warning' | 'danger'

const router = useRouter()
const route = useRoute()
const userInfo = useProfileStore().userInfo

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

/** 将 assistantVersions 规范为版本号片段数组（接口为英文逗号分隔 string，或旧数据 string[]） */
function normalizeAssistantVersionsToParts(raw: unknown): string[] {
  if (raw == null) return []
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x).trim()).filter(Boolean)
  }
  return String(raw)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
}

const pathListDisplay = computed(() => {
  const s = normalizePathListToString(task.value?.pathList)
  return s || '未设置'
})

const assistantVersionsDisplay = computed(() => {
  const parts = normalizeAssistantVersionsToParts(task.value?.assistantVersions)
  return parts.length > 0 ? parts.join('、') : '未设置'
})

const scanResultFileDisplay = computed(() => (task.value?.s3Path || '').trim())

const scanResultFileButtonText = computed(() =>
    scanResultFileDisplay.value ? '修改文件' : '上传文件',
)

const scanResultUploadRef = ref<{ clearFiles: () => void } | null>(null)

async function handleScanResultFileChange(uploadFile: UploadFile, _uploadFiles: UploadFiles) {
  const raw = uploadFile.raw
  const tid = task.value?.taskId
  if (!raw || !tid) return

  const currentPath = scanResultFileDisplay.value || '（暂无）'

  try {
    await ElMessageBox.confirm(
        `将使用所选文件替换当前扫描结果文件，是否继续？\n\n当前路径：${currentPath}\n将要上传：${raw.name}`,
        '替换扫描结果文件',
        {
          confirmButtonText: '确定替换',
          cancelButtonText: '取消',
          type: 'warning',
          distinguishCancelAndClose: true,
        },
    )
  } catch {
    scanResultUploadRef.value?.clearFiles()
    return
  }

  try {
    // const res = await taskManagementService.uploadScanResultFile(tid, raw, userInfo.w3Id || '')
    const res = await uploadScanResultFile(tid, raw, userInfo.w3Id || '')
    const uploadResponse = res.data
    if (uploadResponse.meta.success) {
      if (task.value) {
        task.value.s3Path = uploadResponse.data
      }
      ElMessage.success('扫描结果文件已更新')
    } else {
      ElMessage.error(uploadResponse.meta.message || '上传失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('上传失败')
  } finally {
    scanResultUploadRef.value?.clearFiles()
  }
}

let pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

/** 从查询任务详情返回的 paginationInfo 同步底部分页（与接口文档 1.1 中 list 项内 paginationInfo 字段一致） */
function syncPaginationFromResponse(
  pInfo: TaskDetailPaginationInfo | null | undefined,
  fallbackCount: number
): void {
  if (pInfo && typeof pInfo.totalCount === 'number') {
    pagination.value.currentPage = pInfo.currentPage
    pagination.value.pageSize = pInfo.pageSize
    pagination.value.total = pInfo.totalCount
  } else {
    pagination.value.total = fallbackCount
  }
}

const loading = ref<boolean>(false)
const error = ref<string>('')
const annotationStatistics = ref<AnnotationStatistics | null>(null)

/** 将接口文档形扫描行转为列表映射逻辑可用的行（补 issue_result、confidence 字符串等） */
function normalizeApiDocScanRowForList(row: TaskScanResultApiDocRow): Record<string, unknown> {
  const conf = row.confidence
  const confidenceStr = typeof conf === 'number' ? String(conf) : String(conf ?? '')
  return {
    ...row,
    issue_result: row.annotation?.issueResult ?? null,
    confidence: confidenceStr,
    check_function_id: row.check_function_id ?? '',
  }
}

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

/** 扫描结果总条数上限（含同规则补条） */
const MAX_SCAN_RESULTS_TOTAL = 20

/** 列表序号：与接口分页一致时从 offset+1 起编号（与「查询任务列表」中 paginationInfo 语义对齐） */
function renumberScanResultIncrementIds(results: ScanResult[], startFrom = 1): ScanResult[] {
  return results.map((r, i) => ({
    ...r,
    self_increment_id: startFrom + i
  }))
}


/** 当前列表中「仅出现 1 次」的规则名数量（可各补 1 条同规则数据） */
function countSingletonRuleNames(results: ScanResult[]): number {
  const m = new Map<string, number>()
  for (const r of results) {
    const rn = (r.rule_name || '').trim()
    if (!rn) continue
    m.set(rn, (m.get(rn) || 0) + 1)
  }
  let n = 0
  for (const c of m.values()) {
    if (c === 1) n++
  }
  return n
}

/**
 * 为「当前仅出现 1 条」的 rule_name 各补一条同规则告警，使规则分布/柱状图/树能体现单规则多缺陷。
 * 接口已返回多条同名的规则不会重复追加。
 * 总条数不超过 MAX_SCAN_RESULTS_TOTAL：若基础 + 待补条数会超限，会先缩短基础列表再补。
 */
function augmentScanResultsWithRepeatedRules(results: ScanResult[]): ScanResult[] {
  if (results.length === 0) return results
  const MAX = MAX_SCAN_RESULTS_TOTAL
  let base = [...results]
  if (base.length > MAX) {
    base = base.slice(0, MAX)
  }
  while (base.length > 0 && base.length + countSingletonRuleNames(base) > MAX) {
    base = base.slice(0, -1)
  }

  const counts = new Map<string, number>()
  for (const r of base) {
    const rn = (r.rule_name || '').trim()
    if (!rn) continue
    counts.set(rn, (counts.get(rn) || 0) + 1)
  }

  const out = [...base]
  let seq = 0
  const doneRule = new Set<string>()
  for (const r of base) {
    if (out.length >= MAX) break
    const rn = (r.rule_name || '').trim()
    if (!rn) continue
    if ((counts.get(rn) || 0) > 1) continue
    if (doneRule.has(rn)) continue
    doneRule.add(rn)
    seq += 1
    const baseId = String(r.warn_uuid || r.id || 'row').replace(/[^a-zA-Z0-9-]/g, '')
    out.push({
      ...r,
      warn_uuid: `dup-rule-${seq}-${baseId}`.slice(0, 120),
      warn_line: (Number(r.warn_line) || 0) + 100 + seq,
      start_line: (Number(r.start_line) || 0) + 100 + seq,
      end_line: (Number(r.end_line) || 0) + 100 + seq,
      warn: `${r.warn || ''}\n（同规则另一条示例告警）`,
      annotation: null,
      issue_result: null,
      reason: null,
      annotator: undefined,
      annotationTime: undefined
    })
    counts.set(rn, 2)
  }
  return out
}

/**
 * 拉取任务详情某一页扫描结果；底部分页与接口返回的 `paginationInfo` 同步（字段与接口文档 1.1 中 list 项内 `paginationInfo` 一致：currentPage、hasNext、hasPrevious、pageSize、totalCount、totalPages）。
 */
const fetchTaskDetailPage = async (
  taskId: string,
  pageNum: number,
  pageSize: number,
  options: { fetchAnnotationStats: boolean }
): Promise<void> => {
  const ruleName = filterForm.value.ruleName?.trim()
  const annotation = filterForm.value.issueResult?.trim()

  /**
   * 以下为 `@/api/task` 中的本地模拟；接入真实后端时，应对齐
   * `src/api/services/taskManagementService.ts` 中同名方法的实际调用（见该文件第 18–26 行注释示例）：
   *
   * - getTaskInfo(taskId)
   *   对应 taskManagementService.getTaskInfo(taskId)
   * - getTaskScanResults(taskId, pageNum, pageSize, ruleName?, annotation?)
   *   对应 taskManagementService.getTaskScanResults(taskId, pageNum, pageSize, ruleName, annotation)
   */
  const [infoRes, scanRes] = await Promise.all([
    getTaskInfo(taskId),
    getTaskScanResults(
      taskId,
      pageNum,
      pageSize,
      ruleName || undefined,
      annotation || undefined,
    ),
  ])

  if (!infoRes.meta.success || !infoRes.data) {
    throw new Error(infoRes.meta.message || '获取任务基本信息失败')
  }
  if (!scanRes.meta.success || !scanRes.data) {
    throw new Error(scanRes.meta.message || '获取任务扫描结果失败')
  }

  const d = infoRes.data
  const scanData = scanRes.data
  const rawScanResults: any[] = Array.isArray(scanData.scanResults)
    ? scanData.scanResults.map((row) => normalizeApiDocScanRowForList(row))
    : []
  const pi = scanData.paginationInfo as TaskDetailPaginationInfo | null | undefined
  syncPaginationFromResponse(pi, rawScanResults.length)

  const resTask = {
    ...d,
    scanResults: rawScanResults,
    paginationInfo: pi ?? null,
  } as any

  const offset =
    pi != null
      ? (pi.currentPage - 1) * pi.pageSize
      : Math.max(0, (pageNum - 1) * pageSize)

  task.value = {
    ...resTask,
    taskId: resTask.taskId || resTask.id,
    taskStatus: resTask.taskStatus || resTask.status,
    pathList: normalizePathListToString(resTask.pathList ?? resTask.scanPaths ?? ''),
    codeLanguage: resTask.codeLanguage || resTask.language || 'Unknown',
    lineNum:
      resTask.lineNum ??
      (resTask.codeLines != null ? Number(resTask.codeLines) / 1000 : 0),
    productName: resTask.productName || resTask.product_name || '-',
    s3Path: resTask.s3Path || `s3://ai-repo-scan/results/${resTask.taskId || resTask.id}`,
    creator: resTask.creator ?? '',
    nameCn: resolveTaskCreatorNameCn((resTask as { nameCn?: string }).nameCn),
    warnCount: typeof d.warnCount === 'number' ? d.warnCount : null,
    scanResults: rawScanResults,
    paginationInfo: pi ?? null,
  } as Task

  if (task.value.taskStatus === TASK_STATUS.COMPLETED) {
    let mapped = rawScanResults.map((item: any, idx: number) => {
      const result: ScanResult = {
        ...item,
        self_increment_id: item.self_increment_id ?? item.index ?? offset + idx + 1,
        warn_uuid: item.warn_uuid || item.warnUuid || item.id,
        file_name: item.file_name || item.fileName,
        warn_line: item.warn_line || item.warnLine || item.line,
        warn_code_block: item.warn_code_block || item.warnCodeBlock || item.code_block || item.codeBlock,
        issue_result: item.issue_result ?? item.issueResult ?? null,
        reason: item.reason ?? null,
        annotation: (() => {
          if (item.annotation) {
            return {
              id: item.annotation.id,
              warnUuid: item.annotation.warnUuid || item.annotation.warn_uuid || item.warn_uuid,
              userId: item.annotation.userId || item.annotation.user_id || item.annotator || '',
              issueResult: item.annotation.issueResult ?? item.annotation.issue_result ?? item.issue_result ?? null,
              reason: item.annotation.reason ?? item.reason ?? null,
              annotationStatus: item.annotation.annotationStatus ?? item.annotation.annotation_status ??
                (item.issue_result !== null && item.issue_result !== undefined ? 1 : undefined),
              createTime: item.annotation.createTime || item.annotation.create_time || item.annotationTime,
              updateTime: item.annotation.updateTime || item.annotation.update_time || item.annotationTime,
              userName: item.annotation.userName || item.annotation.user_name || null,
              userDepartment: item.annotation.userDepartment || item.annotation.user_department || null,
              taskId: item.annotation.taskId || item.annotation.task_id || null,
            }
          }
          if (item.issue_result !== null && item.issue_result !== undefined) {
            return {
              warnUuid: item.warn_uuid || item.warnUuid || item.id || '',
              userId: item.annotator || item.annotation?.userId || '',
              issueResult: item.issue_result ?? item.issueResult ?? null,
              reason: item.reason ?? null,
              annotationStatus: 1,
              createTime: item.annotationTime || item.annotation?.createTime,
              updateTime: item.annotationTime || item.annotation?.updateTime,
            }
          }
          return null
        })(),
      }
      return result
    }) as ScanResult[]

    mapped = augmentScanResultsWithRepeatedRules(mapped)
    mapped = renumberScanResultIncrementIds(mapped, offset + 1)
    scanResultsList.value = mapped
    task.value = { ...task.value, scanResults: mapped as any }

    setTimeout(() => {
      updateAllCharts()
    }, 300)

    if (options.fetchAnnotationStats) {
      try {
        const statisticsResponse = await getAnnotationStatistics(taskId)
        if (statisticsResponse.meta.isSuccess && statisticsResponse.data) {
          annotationStatistics.value = statisticsResponse.data
        }
      } catch (err) {
        console.warn('获取标注统计信息失败:', err)
      }
    }
  } else {
    scanResultsList.value = rawScanResults
  }
}

// 加载任务详情和扫描结果（首页）
const loadTaskData = async (taskId: string): Promise<void> => {
  loading.value = true
  error.value = ''
  pagination.value.currentPage = 1
  annotationStatistics.value = null
  try {
    await fetchTaskDetailPage(taskId, 1, pagination.value.pageSize, { fetchAnnotationStats: true })
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

/** 标注完成度数据口径（接口 annotatedCount / unannotatedCount 优先） */
const annotationRatioCounts = computed(() => ({
  annotated: annotationStatistics.value?.annotatedCount ?? statistics.value.annotated,
  unannotated: annotationStatistics.value?.unannotatedCount ?? statistics.value.unannotated,
}))

/** 标注完成度占比（整数百分比） */
const annotationCompletionPct = computed(() => {
  const {annotated, unannotated} = annotationRatioCounts.value
  const t = annotated + unannotated
  if (!t) return {annotated: 0, unannotated: 0}
  return {
    annotated: Math.round((annotated / t) * 100),
    unannotated: Math.round((unannotated / t) * 100),
  }
})

/** 标注完成率（已标注 / 全部缺陷，整数百分比） */
const annotationCompletionRatePct = computed(() => {
  const {annotated, unannotated} = annotationRatioCounts.value
  const t = annotated + unannotated
  if (!t) return 0
  return Math.round((annotated / t) * 100)
})

/** 标注状态分布中「未标注」数量（与饼图一致：接口未标注数优先） */
const annotationStatusUnmarkedCount = computed(
    () => annotationStatistics.value?.unannotatedCount ?? statistics.value.unmarked,
)

/** 四类标注状态占全部缺陷数的比例（整数百分比） */
const annotationStatusPct = computed(() => {
  const s = statistics.value
  const unmarked = annotationStatusUnmarkedCount.value
  const needModify = s.needModify
  const noNeedModify = s.noNeedModify
  const falsePositive = s.falsePositive
  const t = needModify + noNeedModify + falsePositive + unmarked
  if (!t) return {needModify: 0, noNeedModify: 0, falsePositive: 0, unmarked: 0}
  return {
    needModify: Math.round((needModify / t) * 100),
    noNeedModify: Math.round((noNeedModify / t) * 100),
    falsePositive: Math.round((falsePositive / t) * 100),
    unmarked: Math.round((unmarked / t) * 100),
  }
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

/** 基于 scanResultsList 的筛选结果（扫描结果唯一数据源仍为 scanResultsList） */
const filteredScanResultsList = computed<ScanResult[]>(() => {
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

/** 接口已按页返回 scanResults；筛选仅作用于当前页数据；total/currentPage/pageSize 来自 paginationInfo */
const pagedScanResultsList = computed<ScanResult[]>(() => filteredScanResultsList.value)

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
const getAnnotationIssueResult = (result: ScanResult): IssueResult => {
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
    const currentUser = userInfo?.w3Id || userInfo?.nameCn || '当前用户'
    const userNameCn = userInfo?.nameCn?.trim() ?? ''

    if (value === null) {
      const reqBody: SaveAnnotationReqBody = {
        taskId,
        warnUuid: uuid,
        issueResult: null,
        userId: '',
        userName: '',
        reason: ''
      }
      // const cancelRes = await taskManagementService.saveAnnotationApi(reqBody)
      const cancelRes = await saveAnnotationApi(reqBody)
      if (!cancelRes.meta.isSuccess) {
        throw new Error(cancelRes.meta.message || '取消标注失败')
      }

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
      const reqBody: SaveAnnotationReqBody = {
        taskId,
        warnUuid: uuid,
        issueResult: value,
        userId: currentUser,
        userName: userNameCn,
        reason: result.annotation?.reason ?? result.reason ?? ''
      }
      // const saveRes = await taskManagementService.saveAnnotationApi(reqBody)
      const saveRes = await saveAnnotationApi(reqBody)
      if (!saveRes.meta.isSuccess) {
        throw new Error(saveRes.meta.message || '保存标注失败')
      }
      const saved = saveRes.data
      if (!saved) {
        throw new Error(saveRes.meta.message || '保存标注失败：未返回数据')
      }

      // 更新 result 对象的标注信息（标注时间以服务端返回为准）
      result.issue_result = value
      result.reason = result.annotation?.reason || null
      result.annotator = currentUser
      result.annotationTime = saved.updateTime

      // 更新或创建annotation对象
      const annotation = getOrInitAnnotation(result)
      annotation.issueResult = value
      annotation.userId = saved.userId || currentUser
      annotation.reason = annotation.reason || null
      annotation.annotationStatus = saved.annotationStatus
      annotation.id = saved.id
      annotation.createTime = saved.createTime
      annotation.updateTime = saved.updateTime
      annotation.userName = saved.userName
      annotation.userDepartment = saved.userDepartment
      annotation.taskId = saved.taskId ?? taskId

      const statusText = getIssueResultLabel(value)
      ElMessage.success(`已标注为：${statusText}`)
    }
  } catch (error) {
    console.error('保存标注失败:', error)
    ElMessage.error('保存标注失败')
  }
}

// 筛选处理（仅过滤当前页数据，不请求接口）
const handleFilter = (): void => {}

// 分页大小改变：回到第一页并重新请求详情
const handleSizeChange = async (size: number): Promise<void> => {
  const taskId = route.params.id as string
  if (!taskId || task.value?.taskStatus !== TASK_STATUS.COMPLETED) return
  pagination.value.pageSize = size
  pagination.value.currentPage = 1
  loading.value = true
  try {
    await fetchTaskDetailPage(taskId, 1, size, { fetchAnnotationStats: false })
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '加载失败')
  } finally {
    loading.value = false
  }
}

// 当前页改变：按页请求任务详情中的扫描结果
const handleCurrentChange = async (page: number): Promise<void> => {
  const taskId = route.params.id as string
  if (!taskId || task.value?.taskStatus !== TASK_STATUS.COMPLETED) return
  loading.value = true
  try {
    await fetchTaskDetailPage(taskId, page, pagination.value.pageSize, { fetchAnnotationStats: false })
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '加载失败')
  } finally {
    loading.value = false
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
    [TASK_STATUS.NOT_STARTED]: '任务待处理',
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
              {offset: 0, color: '#3b82f6'},
              {offset: 1, color: '#60a5fa'}
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
    console.log('规则名称分布柱状图初始化成功', {count: ruleEntries.length})
  } catch (error) {
    console.error('初始化规则名称分布柱状图失败:', error)
  }
}

// 窗口大小变化处理函数
const handleResize = (): void => {
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
    return
  }

  // 检查 DOM 元素是否存在
  if (!ruleDistributionChartRef.value) {
    setTimeout(() => {
      updateAllCharts()
    }, 200)
    return
  }

  try {
    initRuleDistributionChart()

    // 监听窗口大小变化，自动调整图表大小（避免重复添加）
    if (!Object.prototype.hasOwnProperty.call(window, '_chartResizeHandlerAdded')) {
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
        updateAllCharts()
      }
    },
    {deep: true, immediate: false}
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

/** 底部固定分页条占位，避免最后一项被遮挡 */
.view-content--with-fixed-pagination {
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
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
  margin-bottom: 16px;
}

.task-info-cards-row {
  display: flex;
  gap: 16px;
  align-items: stretch;
  flex-wrap: wrap;
}

.task-detail-field-card {
  flex: 1;
  min-width: 280px;
}

.task-detail-field-card :deep(.el-card__header) {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

.task-detail-field-card :deep(.el-card__body) {
  padding: 16px;
}

.task-detail-card-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.task-detail-fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-detail-field-line {
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
  word-break: break-word;
}

.task-detail-link {
  color: #409eff;
  text-decoration: none;
}

.task-detail-link:hover {
  text-decoration: underline;
}

.task-detail-muted {
  color: #909399;
}

.task-detail-field-line--scan-file {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.task-detail-scan-file-main {
  flex: 1;
  min-width: 0;
}

.task-detail-scan-grid {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-rows: auto auto;
  column-gap: 4px;
  row-gap: 4px;
  align-items: start;
}

.task-detail-scan-label {
  grid-column: 1;
  grid-row: 1;
  flex-shrink: 0;
}

.task-detail-scan-file-value {
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-detail-scan-hint {
  grid-column: 2;
  grid-row: 2;
  font-size: 12px;
  line-height: 1.5;
  color: #909399;
}

.task-detail-scan-upload {
  flex-shrink: 0;
  margin-top: 2px;
}

.task-detail-scan-upload :deep(.el-upload) {
  display: inline-block;
}

.dashboard-section,
.pagination-section:not(.pagination-bar-fixed),
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

.dashboard-content {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  align-items: stretch;
}

/* 规则分布图独占下一整行 */
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

.metric-panel .chart-title {
  margin-bottom: 12px;
}

.metric-panel-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.metric-hero {
  text-align: center;
  padding: 8px 0 4px;
}

.metric-hero-value {
  font-size: 48px;
  font-weight: 700;
  line-height: 1;
  color: #059669;
  letter-spacing: -0.02em;
}

.metric-hero-unit {
  font-size: 22px;
  font-weight: 600;
  color: #059669;
  margin-left: 2px;
}

.metric-hero-caption {
  margin-top: 8px;
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.metric-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.metric-grid-4 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.metric-cell {
  padding: 16px 14px;
  border-radius: 10px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  text-align: center;
}

.metric-cell-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  color: #111827;
}

.metric-cell-label {
  margin-top: 8px;
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.metric-cell-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #9ca3af;
}

.metric-cell--annotated .metric-cell-value {
  color: #059669;
}

.metric-cell--unannotated .metric-cell-value {
  color: #4b5563;
}

.metric-cell--need-modify .metric-cell-value {
  color: #dc2626;
}

.metric-cell--no-need-modify .metric-cell-value {
  color: #d97706;
}

.metric-cell--false-positive .metric-cell-value {
  color: #2563eb;
}

.metric-cell--unmarked .metric-cell-value {
  color: #475569;
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
  align-items: center;
  padding: 20px 0;
}

.pagination-section.pagination-bar-fixed {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 110;
  margin: 0;
  padding: 12px 24px calc(12px + env(safe-area-inset-bottom, 0px));
  background: #ffffff;
  border-radius: 0;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -4px 16px rgba(15, 23, 42, 0.08);
}

@media (min-width: 1201px) {
  .pagination-section.pagination-bar-fixed {
    right: 360px;
  }
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
  .task-info-cards-row {
    flex-direction: column;
  }

  .task-detail-field-line--scan-file {
    flex-wrap: wrap;
    align-items: flex-start;
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

  .metric-hero-value {
    font-size: 40px;
  }
}

@media (min-width: 769px) and (max-width: 1200px) {
  .dashboard-content {
    gap: 16px;
  }
}
</style>
