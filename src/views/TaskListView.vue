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
                :label="status.label"
                :value="key"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="创建时间">
            <el-date-picker
              v-model="filterForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 240px"
              @change="handleFilter"
            />
          </el-form-item>
          <el-form-item>
            <el-button @click="handleResetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 任务列表区域 -->
      <div class="task-list-section">
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="3" animated />
        </div>
        <div v-else-if="filteredTasks.length === 0" class="empty-container">
          <el-empty description="暂无任务数据" />
        </div>
        <div v-else class="list-content">
          <div
            v-for="task in scanTasks"
            :key="task.taskId"
            class="task-card"
          >
            <div class="card-header">
              <div class="card-title">
                <span class="task-name">{{ task.taskName }}</span>
                <el-tag :type="TASK_STATUS_MAP[task.taskStatus].type" size="small">
                  {{ TASK_STATUS_MAP[task.taskStatus].label }}
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
                <span class="item-value">{{ task.creator }}</span>
              </div>
              <div class="card-item">
                <span class="item-label">创建时间：</span>
                <span class="item-value">{{ task.createTime }}</span>
              </div>
              <div class="card-item">
                <span class="item-label">扫描助手：</span>
                <span class="item-value">
                  <el-tag
                    v-for="version in task.assistantVersions"
                    :key="version"
                    size="small"
                    style="margin-right: 4px"
                  >
                    {{ version }}
                  </el-tag>
                </span>
              </div>
              <div class="card-item">
                <span class="item-label">扫描路径：</span>
                <span class="item-value">{{ task.pathList.join(', ') }}</span>
              </div>
              <div class="card-item">
                <span class="item-label">代码语言：</span>
                <span class="item-value">{{ task.codeLanguage }}</span>
              </div>
              <div class="card-item">
                <span class="item-label">代码量：</span>
                <span class="item-value">{{ task.lineNum }}万行</span>
              </div>
              <div class="card-item">
                <span class="item-label">产品名称：</span>
                <span class="item-value">{{ task.productName || '-' }}</span>
              </div>
            </div>
            <div class="card-footer">
              <el-button type="primary" size="small" @click="handleViewDetail(task.taskId)">
                查看详情
              </el-button>
              <el-button
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
      <div class="pagination-section" v-if="filteredTasks.length > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[8, 12, 16, 20]"
          :total="filteredTasks.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
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
import CreateTaskDialog from '../components/CreateTaskDialog.vue'
import { useTaskStore, TASK_STATUS_MAP, TASK_STATUS } from '../stores/task'

const router = useRouter()
const taskStore = useTaskStore()

const createDialogVisible = ref(false)
const loading = ref(false)
const taskType = ref('all') // 'all' | 'my'
const currentPage = ref(1)
const pageSize = ref(8) // 减少每页显示数量

// 筛选表单
const filterForm = ref({
  taskName: '',
  status: '',
  dateRange: null
})

// 计算属性：根据任务类型和筛选条件过滤任务
const filteredTasks = computed(() => {
  let tasks = taskStore.tasks

  // 根据任务类型过滤（兼容旧数据格式）
  if (taskType.value === 'my') {
    tasks = tasks.filter(task => {
      const creator = task.creator || ''
      return creator === taskStore.currentUser || creator.includes(taskStore.currentUser)
    })
  }

  // 根据任务名称搜索
  if (filterForm.value.taskName) {
    const keyword = filterForm.value.taskName.toLowerCase()
    tasks = tasks.filter(task => 
      task.taskName.toLowerCase().includes(keyword)
    )
  }

  // 根据状态筛选（兼容旧数据格式）
  if (filterForm.value.status) {
    tasks = tasks.filter(task => {
      const status = task.taskStatus || task.status
      return status === filterForm.value.status
    })
  }

  // 根据日期范围筛选
  if (filterForm.value.dateRange && filterForm.value.dateRange.length === 2) {
    const [startDate, endDate] = filterForm.value.dateRange
    tasks = tasks.filter(task => {
      const taskDate = task.createTime.split(' ')[0]
      return taskDate >= startDate && taskDate <= endDate
    })
  }

  return tasks
})

// 分页后的任务列表
const scanTasks = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredTasks.value.slice(start, end)
})

// 打开创建任务弹窗
const openCreateDialog = () => {
  createDialogVisible.value = true
}

// 创建任务成功回调
const handleCreateSuccess = (taskData) => {
  taskStore.addTask(taskData)
  ElMessage.success('任务创建成功！')
  // 如果当前在"我的任务"视图，切换到全部任务以显示新创建的任务
  if (taskType.value === 'my') {
    taskType.value = 'all'
  }
  currentPage.value = 1
}

// 筛选处理
const handleFilter = () => {
  currentPage.value = 1 // 重置到第一页
}

// 重置筛选
const handleResetFilter = () => {
  filterForm.value = {
    taskName: '',
    status: '',
    dateRange: null
  }
  currentPage.value = 1
}

// 查看详情
const handleViewDetail = (taskId) => {
  router.push(`/task/${taskId}`)
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
    
    const success = taskStore.deleteTask(taskId)
    if (success) {
      ElMessage.success('任务删除成功！')
      // 如果当前页没有数据了，返回上一页
      if (scanTasks.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
      }
    } else {
      ElMessage.error('任务删除失败！')
    }
  } catch {
    // 用户取消删除
  }
}

// 分页大小改变
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

// 当前页改变
const handleCurrentChange = (page) => {
  currentPage.value = page
}

// 监听任务类型变化，重置分页
watch(taskType, () => {
  currentPage.value = 1
})

// 组件挂载时加载数据
onMounted(() => {
  // 这里可以调用API加载任务列表
  // 目前使用模拟数据，所以不需要额外加载
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
