<template>
  <div class="batch-create-body">
    <div class="batch-create-toolbar">
      <el-button type="primary" plain @click="handleDownloadTemplate">
        下载导入模板
      </el-button>
      <el-upload
          ref="uploadRef"
          class="batch-upload"
          :auto-upload="false"
          :show-file-list="false"
          accept=".xlsx,.xls,.csv"
          :on-change="handleFileChange"
      >
        <el-button type="primary">选择 Excel 文件</el-button>
      </el-upload>
      <span v-if="fileName" class="file-name">{{ fileName }}</span>
    </div>

    <el-alert
        type="info"
        :closable="false"
        show-icon
        class="batch-create-tip"
    >
      <template #title>
        请下载模板填写后导入。「本机启动URL」与「模型名称」为可选字段。
        单次最多导入 {{ BATCH_TASK_MAX_ROWS }} 条，创建人自动取当前登录用户。
      </template>
    </el-alert>

    <div v-if="parsedRows.length > 0" class="preview-section">
      <div class="preview-summary">
        <span>共 {{ parsedRows.length }} 条</span>
        <span v-if="invalidCount > 0" class="preview-summary--error">
          ，{{ invalidCount }} 条校验未通过
        </span>
        <span v-else class="preview-summary--ok">，校验通过</span>
      </div>
      <el-table
          :data="parsedRows"
          border
          stripe
          max-height="360"
          size="small"
          row-key="rowIndex"
      >
        <el-table-column prop="rowIndex" label="行号" width="56" align="center"/>
        <el-table-column prop="data.taskName" label="任务名称" min-width="120" show-overflow-tooltip/>
        <el-table-column prop="data.repoUrl" label="代码仓Git地址" min-width="160" show-overflow-tooltip/>
        <el-table-column prop="data.branch" label="扫描分支" width="88"/>
        <el-table-column prop="data.productName" label="产品名称" width="100" show-overflow-tooltip/>
        <el-table-column prop="data.hostUrl" label="本机启动URL" min-width="120" show-overflow-tooltip/>
        <el-table-column prop="data.modelName" label="模型名称" width="100" show-overflow-tooltip/>
        <el-table-column label="校验" min-width="160">
          <template #default="{ row }">
            <el-tag v-if="row.errors.length === 0" type="success" size="small">通过</el-tag>
            <div v-else class="error-list">
              <span v-for="(err, idx) in row.errors" :key="idx">{{ err }}</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-empty
        v-else
        description="请先下载模板并导入 Excel 文件"
        :image-size="80"
    />

    <div v-if="submitResult" class="result-section">
      <el-divider content-position="left">创建结果</el-divider>
      <p class="result-summary">
        成功 {{ submitResult.successCount }} 条，失败 {{ submitResult.failureCount }} 条
      </p>
      <el-table
          v-if="failedResults.length > 0"
          :data="failedResults"
          border
          size="small"
          max-height="160"
      >
        <el-table-column prop="rowIndex" label="行号" width="56" align="center"/>
        <el-table-column prop="taskName" label="任务名称" min-width="120"/>
        <el-table-column prop="message" label="失败原因" min-width="200" show-overflow-tooltip/>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useProfileStore } from '@/stores/userProfile'
import { batchCreateTasksApi } from '@/api/taskManagementApi'
import {
  BATCH_TASK_MAX_ROWS,
  downloadBatchTaskTemplate,
  parseBatchTaskFile,
  toBatchCreateItems,
} from '@/views/taskManagement/utils/batchTaskImport'

const emit = defineEmits(['success'])

const profileStore = useProfileStore()
const uploadRef = ref(null)
const fileName = ref('')
const parsedRows = ref([])
const submitting = ref(false)
const submitResult = ref(null)

const invalidCount = computed(
    () => parsedRows.value.filter((r) => r.errors.length > 0).length,
)

const canSubmit = computed(
    () => parsedRows.value.length > 0 && invalidCount.value === 0 && !submitting.value,
)

const failedResults = computed(() => {
  if (!submitResult.value?.results) return []
  return submitResult.value.results.filter((r) => !r.success)
})

function resetState() {
  fileName.value = ''
  parsedRows.value = []
  submitResult.value = null
  submitting.value = false
  uploadRef.value?.clearFiles?.()
}

function handleDownloadTemplate() {
  downloadBatchTaskTemplate()
  ElMessage.success('模板已开始下载')
}

async function handleFileChange(uploadFile) {
  const file = uploadFile?.raw
  if (!file) return
  submitResult.value = null
  fileName.value = file.name
  try {
    parsedRows.value = await parseBatchTaskFile(file)
    if (invalidCount.value > 0) {
      ElMessage.warning(`已解析 ${parsedRows.value.length} 条，其中 ${invalidCount.value} 条校验未通过`)
    } else {
      ElMessage.success(`已解析 ${parsedRows.value.length} 条，校验通过`)
    }
  } catch (e) {
    parsedRows.value = []
    ElMessage.error(e?.message || '文件解析失败')
  }
}

async function submit() {
  if (!canSubmit.value) return false

  const userInfo = profileStore.userInfo
  submitting.value = true
  submitResult.value = null

  try {
    const res = await batchCreateTasksApi({
      creator: userInfo.w3Id || '',
      nameCn: userInfo.nameCn || undefined,
      tasks: toBatchCreateItems(parsedRows.value),
    })

    if (!res.meta.isSuccess) {
      ElMessage.error(res.meta.message || '批量创建失败')
      return false
    }

    submitResult.value = res.data
    const { successCount, failureCount } = res.data

    if (failureCount === 0) {
      ElMessage.success(`成功创建 ${successCount} 条任务`)
      emit('success', res.data)
      return true
    }
    if (successCount > 0) {
      ElMessage.warning(`部分成功：${successCount} 条成功，${failureCount} 条失败`)
      emit('success', res.data)
      return false
    }
    ElMessage.error('全部创建失败，请查看失败原因')
    return false
  } catch (e) {
    console.error('批量创建失败:', e)
    ElMessage.error(e?.message || '批量创建失败，请稍后重试')
    return false
  } finally {
    submitting.value = false
  }
}

defineExpose({
  resetState,
  submit,
  canSubmit,
  submitting,
  parsedRows,
})
</script>

<style scoped>
.batch-create-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.batch-create-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.batch-upload {
  display: inline-block;
}

.file-name {
  color: #606266;
  font-size: 13px;
}

.batch-create-tip {
  margin-bottom: 0;
}

.preview-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-summary {
  font-size: 13px;
  color: #606266;
}

.preview-summary--error {
  color: #f56c6c;
}

.preview-summary--ok {
  color: #67c23a;
}

.error-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: #f56c6c;
  line-height: 1.4;
}

.result-section {
  margin-top: 4px;
}

.result-summary {
  margin: 0 0 8px;
  font-size: 13px;
  color: #303133;
}
</style>