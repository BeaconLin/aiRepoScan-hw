<template>
  <div class="task-list-page">
    <!-- 创建任务弹窗 -->
    <CreateTaskDialog
        v-model="createDialogVisible"
        @success="handleCreateSuccess"
    />

    <!-- 统一容器：包含任务类型、筛选、列表和分页 -->
    <div class="task-container">
      <!-- 任务类型切换和创建按钮区域 -->
      <div class="task-type-section">
        <div class="type-actions">
          <el-radio-group v-model="taskType" size="default">
            <el-radio-button label="all">全部任务</el-radio-button>
            <el-radio-button label="my">我的任务</el-radio-button>
          </el-radio-group>
          <el-button type="primary" @click="openCreateDialog">
            + 创建任务
          </el-button>
        </div>
      </div>

      <!-- 任务筛选区域 -->
      <div class="filter-section">
        <el-form :inline="true" :model="filterForm" class="filter-form">
          <el-form-item label="任务名称">
            <el-input
                v-model="filterForm.taskName"
                placeholder="请输入任务名称"
                clearable
                style="width: 200px"
                @input="handleFilter"
            />
          </el-form-item>
          <el-form-item label="任务状态">
            <el-select
                v-model="filterForm.status"
                placeholder="请选择状态"
                clearable
                style="width: 150px"
                @change="handleFilter"
            >
              <el-option
                  v-for="(status, key) in TASK_STATUS_MAP"
                  :key="key"
                  :label="key"
                  :value="key"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button @click="handleResetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 任务列表区域 -->
      <div class="task-list-section">
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="3" animated/>
        </div>
        <div v-else-if="filteredTasks.length === 0" class="empty-container">
          <el-empty description="暂无任务数据"/>
        </div>
        <div v-else class="list-content">
          <div
              v-for="task in filteredTasks"
              :key="task.taskId"
              class="task-card"
          >
            <div class="card-header">
              <div class="card-title">
                <span class="task-name">{{ task.taskName }}</span>
                <el-tag
                    :type="(TASK_STATUS_MAP[task.taskStatus] || 'info') as 'info' | 'success' | 'warning' | 'danger'"
                    size="small"
                >
                  {{ task.taskStatus }}
                </el-tag>
              </div>
            </div>
            <div class="card-body">
              <div class="card-item">
                <span class="item-label">代码仓URL：</span>
                <span class="item-value">{{ task.repoUrl }}</span>
              </div>
              <div class="card-item">
                <span class="item-label">扫描分支：</span>
                <span class="item-value">{{ task.branch }}</span>
              </div>
              <div class="card-item">
                <span class="item-label">创建人：</span>
                <span class="item-value">{{ formatTaskCreatorDisplay(task) }}</span>
              </div>
              <div class="card-item">
                <span class="item-label">创建时间：</span>
                <span class="item-value">{{ task.createTime }}</span>
              </div>
              <div class="card-item">
                <span class="item-label">扫描助手：</span>
                <span class="item-value">
                  <template v-if="task.assistantVersions.length">
                    <el-tag
                        v-for="(version, idx) in task.assistantVersions"
                        :key="`${task.taskId}-av-${idx}`"
                        size="small"
                        style="margin-right: 4px"
                    >
                      {{ version }}
                    </el-tag>
                  </template>
                  <span v-else>--</span>
                </span>
              </div>
              <div class="card-item">
                <span class="item-label">扫描路径：</span>
                <span class="item-value">{{ formatPathListDisplay(task.pathList) }}</span>
              </div>
            </div>
            <div class="card-footer">
              <el-button type="primary" size="small" @click="handleViewDetail(task.taskId)">
                查看详情
              </el-button>
              <el-button
                  v-if="canDeleteTask(task.creator)"
                  type="danger"
                  size="small"
                  @click="handleDelete(task.taskId)"
                  :disabled="task.taskStatus === TASK_STATUS.RUNNING"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页区域 -->
      <div class="pagination-section">
        <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[8, 12, 16, 20]"
            :total="pageTotal"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  ElButton,
  ElMessage,
  ElMessageBox,
  ElTag,
  ElSkeleton,
  ElEmpty,
  ElPagination,
  ElRadioGroup,
  ElRadioButton
} from 'element-plus'
import {
  queryTaskList,
  deleteTaskById,
} from '@/api/task'
import CreateTaskDialog from '@/views/taskManagement/components/CreateTaskDialog.vue'
import { TASK_STATUS_MAP, TASK_STATUS } from '@/constants/scanTaskConst'
import { useProfileStore } from '@/stores/userProfile'
import taskManagementService from '@/api/services/taskManagementService'

type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS]

/** 任务列表项（不含扫描结果明细；与列表接口返回一致） */
interface TaskListItem {
  taskId: string
  taskName: string
  repoUrl: string
  branch: string
  pathList: string
  assistantVersions: string[]
  creator: string
  nameCn: string
  createTime: string
  taskStatus: TaskStatus
  codeLanguage: string
  lineNum: number
  productName: string
  s3Path: string
}

const profileStore = useProfileStore()

/** pathList 为逗号分隔字符串；兼容 localStorage 中仍为数组的旧数据 */
function formatPathListDisplay(v) {
  if (v == null || v === '') return '--'
  if (Array.isArray(v)) return v.join(',')
  return String(v)
}

/**
 * 接口多为英文逗号连接的助手版本字符串；兼容已为 string[] 的旧数据。
 * 拆分为去空白后的版本号数组。
 */
function parseAssistantVersionsToArray(raw: unknown): string[] {
  if (raw == null) return []
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x).trim()).filter(Boolean)
  }
  return String(raw)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
}

/** 任务列表创建人展示：「中文名 短工号」（与 TaskDetailView 一致） */
function formatTaskCreatorDisplay(task: { creator?: string; nameCn?: string }) {
  const w3 = (task.creator || '').trim()
  const cn = (task.nameCn || '').trim()
  if (cn && w3) return `${cn} ${w3}`
  return w3 || '--'
}

const router = useRouter()

/**
 * 通用的任务加载函数
 * @param creator 创建者筛选条件，可选
 * @param taskStatus 任务状态筛选条件，可选
 * @param taskName 任务名称筛选条件，可选
 */
const loadTasksData = async (creator?: string, taskStatus?: string, taskName?: string) => {
  // const res = await taskManagementService.queryTaskList(currentPage.value, pageSize.value, creator, taskStatus, taskName)
  const res = await queryTaskList(currentPage.value, pageSize.value, creator, taskStatus, taskName)

  if (res.meta.isSuccess) {
    filteredTasks.value = res.data.list.map((row) => ({
      taskId: row.taskId,
      taskName: row.taskName,
      repoUrl: row.repoUrl,
      branch: row.branch,
      pathList: row.pathList,
      creator: row.creator,
      nameCn: row.nameCn ?? '',
      createTime: row.createTime,
      taskStatus: row.taskStatus as TaskStatus,
      codeLanguage: row.codeLanguage ?? '',
      lineNum: row.lineNum ?? 0,
      productName: row.productName,
      s3Path: row.s3Path,
      assistantVersions: parseAssistantVersionsToArray(row.assistantVersions),
    }))

    pageTotal.value = res.data.total
    currentPage.value = res.data.page
  }
}

// 加载所有任务
const loadTasks = async () => {
  // 不传筛选参数，加载所有任务
  await loadTasksData()
}

// 加载我的任务
const loadMyTasks = async () => {
  await loadTasksData(profileStore.userInfo?.w3Id) // 传入creator参数按用户筛选
}

// 根据当前的任务类型、筛选条件加载任务
const loadTasksByCurrentCondition = async () => {
  const creator = taskType.value === 'my' ? profileStore.userInfo?.w3Id : undefined
  // 确保传递完整的筛选条件，包括任务状态和任务名称
  const taskStatus = filterForm.value.status || undefined
  const taskName = filterForm.value.taskName || undefined
  await loadTasksData(creator, taskStatus, taskName)
}
const createDialogVisible = ref(false)
const loading = ref(false)
const taskType = ref('all') // 'all' | 'my'
const currentPage = ref(1)
const pageSize = ref(8) // 减少每页显示数量
const pageTotal = ref(0)

// 筛选表单
const filterForm = ref({
  taskName: '',
  status: ''
})

// 计算属性：根据任务类型和筛选条件过滤任务
const filteredTasks = ref<TaskListItem[]>([])

// 打开创建任务弹窗
const openCreateDialog = () => {
  createDialogVisible.value = true
}

// 创建任务成功回调（任务已由 CreateTaskDialog 调用 task.ts 创建，此处仅刷新列表）
const handleCreateSuccess = async () => {
  loading.value = true
  try {
    await loadTasks()
    ElMessage.success('任务创建成功！')
    if (taskType.value === 'my') {
      taskType.value = 'all'
    }
    currentPage.value = 1
  } finally {
    loading.value = false
  }
}

// 筛选处理
const handleFilter = async () => {
  currentPage.value = 1 // 重置到第一页
  await loadTasksByCurrentCondition()
}

// 重置筛选
const handleResetFilter = async () => {
  filterForm.value = {
    taskName: '',
    status: ''
  }
  currentPage.value = 1
  await loadTasksByCurrentCondition()
}

// 查看详情
const handleViewDetail = (taskId) => {
  router.push(`/task/${taskId}`)
}

// 判断当前用户是否可以删除任务
const canDeleteTask = (taskCreator: string) => {
  const w3Id = profileStore.userInfo?.w3Id?.trim()
  const nameCn = profileStore.userInfo?.nameCn
  const fullId = `${nameCn || ''} ${w3Id || ''}`.trim()
  if (!w3Id) return false
  const c = (taskCreator || '').trim()
  return c === w3Id || c === fullId
}

// 删除任务
const handleDelete = async (taskId) => {
  try {
    await ElMessageBox.confirm(
        '确定要删除这个任务吗？删除后无法恢复。',
        '确认删除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
    )

    const res = await deleteTaskById(taskId)
    // const res = await taskManagementService.deleteTaskById(taskId)
    const success = res.meta.isSuccess && !!res.data
    if (success) await loadTasks()
    if (success) {
      ElMessage.success('任务删除成功！')
      // 如果当前页没有数据了，返回上一页

    } else {
      ElMessage.error(res.meta.message || '任务删除失败！')
    }
  } catch {
    // 用户取消删除
  }
}

// 分页大小改变
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  loadTasksByCurrentCondition()
}

// 当前页改变
const handleCurrentChange = (page) => {
  currentPage.value = page
  loadTasksByCurrentCondition()
}

// 监听任务类型变化，重置分页
watch(taskType, async () => {
  currentPage.value = 1
  await loadTasksByCurrentCondition()
})

onMounted(async () => {
  loading.value = true
  try {
    await loadTasksByCurrentCondition()
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.task-list-page {
  margin: 0 auto;
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

/* 统一容器 */
.task-container {
  background: #ffffff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.task-type-section {
  margin-bottom: 16px;
}

.type-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-form {
  margin: 0;
}

.task-list-section {
  padding-top: 12px;
  margin-bottom: 16px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.loading-container,
.empty-container {
  padding: 40px 0;
}

.pagination-section {
  display: flex;
  justify-content: center;
  padding-top: 16px;
  flex-shrink: 0;
}

.list-content {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

/* 响应式布局：中等屏幕每行3个 */
@media (max-width: 1600px) {
  .list-content {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 响应式布局：小屏幕每行2个 */
@media (max-width: 1200px) {
  .list-content {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 响应式布局：移动端每行1个 */
@media (max-width: 768px) {
  .list-content {
    grid-template-columns: 1fr;
  }
}

.task-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: #ffffff;
  transition: all 0.3s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.task-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e5e7eb;
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-name {
  font-weight: 600;
  font-size: 15px;
  color: #1f2937;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
  flex: 1;
}

.card-item {
  display: flex;
  align-items: flex-start;
  font-size: 13px;
  line-height: 1.4;
}

.item-label {
  color: #6b7280;
  min-width: 75px;
  flex-shrink: 0;
  font-size: 12px;
}

.item-value {
  color: #374151;
  word-break: break-all;
  font-size: 12px;
  line-height: 1.4;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid #f3f4f6;
  flex-shrink: 0;
}
</style>
