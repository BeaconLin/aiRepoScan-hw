<template>
  <el-dialog
      v-model="dialogVisible"
      title="创建代码仓扫描任务"
      :width="createMode === 'batch' ? '960px' : '800px'"
      :close-on-click-modal="false"
      @close="handleClose"
  >
    <el-tabs v-model="createMode" class="create-mode-tabs">
      <el-tab-pane label="单个创建" name="single">
        <div class="dialog-body-scroll">
          <el-form
              ref="formRef"
              :model="formData"
              :rules="rules"
              label-width="136px"
              label-position="right"
          >
        <el-form-item label="任务名称" prop="taskName">
          <el-input
              v-model="formData.taskName"
              placeholder="请输入任务名称"
              clearable
          />
        </el-form-item>

        <el-form-item prop="repoUrl" class="form-item-with-help-label">
          <template #label>
            <span class="form-item-label-with-help">
              <span class="form-label-text">代码仓Git地址</span>
              <el-tooltip
                  effect="light"
                  placement="right"
                  :show-after="200"
                  popper-class="create-task-repo-url-tooltip"
              >
                <template #content>
                  <div class="repo-url-help-content">
                    <p class="repo-url-help-intro">仅支持 HTTPS 形式的 Git 克隆地址。</p>
                    <div class="repo-url-help-diagram">
                      <img
                          src="@/../public/assets/image/gitImg.png"
                          alt="代码仓 Git 地址获取示意图"
                          class="repo-url-help-diagram__img"
                      />
                    </div>
                  </div>
                </template>
                <span
                    class="form-help-icon"
                    role="button"
                    tabindex="0"
                    aria-label="代码仓 Git 地址填写说明"
                >?</span>
              </el-tooltip>
            </span>
          </template>
          <el-input
              v-model="formData.repoUrl"
              placeholder="请输入 HTTPS 形式的代码仓 Git 克隆地址"
              clearable
          />
        </el-form-item>

        <el-form-item label="扫描分支" prop="branch">
          <el-input
              v-model="formData.branch"
              placeholder="请输入扫描分支，例如：main、master"
              clearable
          />
        </el-form-item>

        <el-form-item prop="scanPaths">
          <template #label>
            <span class="form-item-label-with-help">
              <span class="form-label-text">扫描路径</span>
              <el-tooltip
                  effect="light"
                  placement="right"
                  :show-after="200"
                  popper-class="create-task-form-help-tooltip"
              >
                <template #content>
                  <p class="form-help-tooltip-text">
                    可选参数，填写相对项目根目录的路径，多个路径用英文逗号拼接，例如：src,view,utils，不填则默认全部扫描
                  </p>
                </template>
                <span
                    class="form-help-icon"
                    role="button"
                    tabindex="0"
                    aria-label="扫描路径填写说明"
                >?</span>
              </el-tooltip>
            </span>
          </template>
          <el-input
              v-model="formData.scanPaths"
              placeholder="可选，多个路径使用英文逗号分隔，例如：src,view,utils"
              clearable
          />
        </el-form-item>

        <el-form-item label="代码语言" prop="codeLanguage">
          <el-select
              v-model="formData.codeLanguage"
              placeholder="C/C++"
              style="width: 100%"
          >
            <el-option label="C/C++" value="C++"/>
          </el-select>
        </el-form-item>

        <el-form-item label="创建人">
          <el-input
              v-model="formData.creator"
              disabled
              placeholder="自动填充当前登录用户"
          />
        </el-form-item>

        <el-form-item label="产品名称" prop="productName">
          <el-input
              v-model="formData.productName"
              placeholder="请输入产品名称"
              clearable
          />
        </el-form-item>

        <el-form-item label="部门名称">
          <el-input
              v-model="formData.deptName"
              placeholder="请输入部门名称（可选）"
              clearable
          />
        </el-form-item>

        <el-form-item label="PDU名称">
          <el-input
              v-model="formData.pduName"
              placeholder="请输入PDU名称（可选）"
              clearable
          />
        </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <el-tab-pane label="批量导入" name="batch">
        <BatchCreateTaskPanel ref="batchPanelRef" @success="handleBatchSuccess"/>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <template v-if="createMode === 'single'">
          <el-button @click="handleReset">重置</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            提交创建
          </el-button>
        </template>
        <template v-else>
          <el-button type="primary" :loading="batchSubmitting" :disabled="!batchCanSubmit" @click="handleBatchSubmit">
            确认创建{{ batchRowCount > 0 ? `（${batchRowCount} 条）` : '' }}
          </el-button>
        </template>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useProfileStore } from '@/stores/userProfile'
import { createTaskApi } from '@/api/taskManagementApi'
import BatchCreateTaskPanel from '@/views/taskManagement/components/BatchCreateTaskPanel.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'success'])
const profileStore = useProfileStore()
const dialogVisible = ref(false)
const formRef = ref(null)
const batchPanelRef = ref(null)
const submitting = ref(false)
const createMode = ref('single')

const batchCanSubmit = computed(() => batchPanelRef.value?.canSubmit?.value ?? false)
const batchSubmitting = computed(() => batchPanelRef.value?.submitting?.value ?? false)
const batchRowCount = computed(() => batchPanelRef.value?.parsedRows?.value?.length ?? 0)

const DEFAULT_CODE_LANGUAGE = 'C/C++'
const DEFAULT_ASSISTANT_VERSION = '内存安全v1.0.0'


const formData = reactive({
  taskName: '',
  repoUrl: '',
  branch: '',
  assistantVersions: [DEFAULT_ASSISTANT_VERSION],
  scanPaths: '',
  creator: '', // 从用户信息获取
  productName: '', // 默认值
  deptName: '', // 可选
  pduName: '', // 可选
  codeLanguage: DEFAULT_CODE_LANGUAGE,
  lineNum: '',
  createTime: '' // 实际应该自动填充当前时间
})

/** 仅允许 HTTPS Git 克隆地址：https://主机/路径.git */
const isValidRepoGitUrl = (raw) => {
  const url = String(raw ?? '').trim()
  if (!url) return false
  return /^https:\/\/[^\s/]+\/[^\s?]+\.git$/i.test(url)
}

// 表单验证规则
const rules = {
  taskName: [
    {required: true, message: '请输入任务名称', trigger: 'blur'},
    {min: 2, max: 50, message: '任务名称长度在 2 到 50 个字符', trigger: 'blur'}
  ],
  repoUrl: [
    {required: true, message: '请输入代码仓Git地址', trigger: 'blur'},
    {
      validator: (rule, value, callback) => {
        if (!value || String(value).trim() === '') {
          callback()
          return
        }
        if (isValidRepoGitUrl(value)) {
          callback()
        } else {
          callback(
              new Error(
                  '请输入有效的 HTTPS Git 克隆地址，如 https://主机/组织/项目.git'
              )
          )
        }
      },
      trigger: 'blur',
    },
  ],
  branch: [
    {required: true, message: '请输入扫描分支', trigger: 'blur'}
  ],
  scanPaths: [
    {
      validator: (rule, value, callback) => {
        if (!value || String(value).trim() === '') {
          callback()
          return
        }
        const paths = String(value)
            .split(',')
            .map((path) => path.trim())
            .filter((path) => path !== '')
        if (paths.length === 0) {
          callback(new Error('请至少输入一个有效的扫描路径，或留空'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
  productName: [
    {required: true, message: '请输入产品名称', trigger: 'blur'}
  ],
}

// 监听 modelValue 变化
watch(
    () => props.modelValue,
    (newVal) => {
      dialogVisible.value = newVal
      if (newVal) {
        createMode.value = 'single'
        initForm()
        batchPanelRef.value?.resetState?.()
      }
    }
)

// 监听 dialogVisible 变化，同步到父组件
watch(dialogVisible, (newVal) => {
  emit('update:modelValue', newVal)
})

// 初始化表单
const initForm = () => {
  // 重置表单
  formData.taskName = ''
  formData.repoUrl = ''
  formData.branch = ''
  formData.assistantVersions = [DEFAULT_ASSISTANT_VERSION]
  formData.scanPaths = ''
  formData.productName = ''
  formData.deptName = ''
  formData.pduName = ''
  formData.codeLanguage = DEFAULT_CODE_LANGUAGE
  formData.lineNum = ''

  // 从用户信息获取创建人
  const userInfo = profileStore.userInfo
  formData.creator = userInfo.w3Id || ''
  formData.createTime = '' // 提交时再获取

  // 清除验证状态
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

// 初始化用户信息
onMounted(() => {
  initForm()
})


// 重置表单
const handleReset = () => {
  if (formRef.value) {
    formRef.value.resetFields()
    initForm()
  }
}

// 关闭弹窗
const handleClose = () => {
  dialogVisible.value = false
  createMode.value = 'single'
  if (formRef.value) {
    formRef.value.clearValidate()
  }
  batchPanelRef.value?.resetState?.()
}

const handleBatchSuccess = () => {
  emit('success')
}

const handleBatchSubmit = async () => {
  const ok = await batchPanelRef.value?.submit?.()
  if (ok) {
    handleClose()
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) {
    return
  }

  try {
    // 验证表单
    await formRef.value.validate()

    submitting.value = true

    // 处理扫描路径：按逗号分割并过滤空值
    const validScanPaths = formData.scanPaths
        .split(',')
        .map(path => path.trim())
        .filter(path => path !== '')
    // 获取用户信息
    const userInfo = profileStore.userInfo
    const lineNumStr = String(formData.lineNum ?? '').trim()
    const lineNumForApi =
        lineNumStr === '' ? undefined : Number(lineNumStr)

    // 构建创建任务的请求数据
    const createTaskPayload = {
      taskName: formData.taskName.trim(),
      productName: formData.productName.trim(),
      repoUrl: formData.repoUrl.trim(),
      branch: formData.branch.trim(),
      pathList:
          validScanPaths.length > 0 ? validScanPaths.join(',') : undefined,
      creator: formData.creator || userInfo.w3Id || '',
      assistantVersions: formData.assistantVersions.join(','),
      codeLanguage: formData.codeLanguage || undefined,
      lineNum: lineNumForApi,
      deptName: formData.deptName?.trim() || undefined,
      pduName: formData.pduName?.trim() || undefined,
      nameCn: userInfo.nameCn || undefined,
    }

    let createResponse
    try {
      createResponse = await createTaskApi(createTaskPayload)
    } catch (e) {
      console.error('创建任务请求失败:', e)
      ElMessage.error(e?.message || '创建任务失败，请稍后重试')
      return
    }

    if (!createResponse.meta.isSuccess || !createResponse.data?.taskId) {
      ElMessage.error(createResponse.meta.message || '任务创建失败')
      return
    }

    const data = createResponse.data

    ElMessage.success('任务创建成功！')

    // 构建返回给父组件的数据（用于更新任务列表）
    const submitData = {
      taskId: data.taskId,
      taskName: data.taskName,
      repoUrl: formData.repoUrl,
      branch: formData.branch,
      assistantVersions: formData.assistantVersions,
      pathList: validScanPaths.join(','),
      creator: formData.creator || userInfo.w3Id,
      nameCn: data.nameCn ?? userInfo.nameCn ?? '',
      createTime: data.createTime,
      codeLanguage: formData.codeLanguage || DEFAULT_CODE_LANGUAGE,
      lineNum: lineNumForApi ?? 0,
      productName: data.productName,
      deptName: formData.deptName,
      pduName: formData.pduName,
      taskStatus: data.taskStatus || '待处理',
      scanResults: [],
      s3Path: null,
    }

    // 触发成功事件
    emit('success', submitData)

    // 关闭弹窗
    handleClose()
  } catch (error) {
    console.error('创建任务流程失败:', error)
    if (error && error.message) {
      ElMessage.error(error.message)
    } else {
      ElMessage.error('请检查表单输入是否正确')
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.create-mode-tabs {
  margin-top: -8px;
}

.create-mode-tabs :deep(.el-tabs__header) {
  margin-bottom: 16px;
}

.dialog-body-scroll {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  padding-right: 8px;
}

.dialog-body-scroll::-webkit-scrollbar {
  width: 6px;
}

.dialog-body-scroll::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.dialog-body-scroll::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.dialog-body-scroll::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.form-item-with-help-label .el-form-item__label) {
  white-space: nowrap;
}

.form-item-label-with-help {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.form-label-text {
  flex-shrink: 0;
  white-space: nowrap;
}

.form-help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  font-size: 12px;
  line-height: 1;
  color: #909399;
  border: 1px solid #c0c4cc;
  cursor: help;
  user-select: none;
  transition: color 0.2s, border-color 0.2s;
}

.form-help-icon:hover,
.form-help-icon:focus-visible {
  color: #409eff;
  border-color: #409eff;
  outline: none;
}
</style>

<style>
.create-task-form-help-tooltip {
  max-width: 360px;
}

.create-task-form-help-tooltip .form-help-tooltip-text {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: #606266;
}

.create-task-repo-url-tooltip {
  max-width: 420px;
}

.create-task-repo-url-tooltip .repo-url-help-content {
  font-size: 12px;
  line-height: 1.6;
  color: #606266;
}

.create-task-repo-url-tooltip .repo-url-help-intro {
  margin: 0 0 8px;
}

.create-task-repo-url-tooltip .repo-url-help-example {
  margin: 0 0 6px;
  word-break: break-all;
}

.create-task-repo-url-tooltip .repo-url-help-tag {
  display: inline-block;
  min-width: 42px;
  margin-right: 4px;
  font-weight: 600;
  color: #303133;
}

.create-task-repo-url-tooltip .repo-url-help-diagram {
  margin-top: 10px;
}

.create-task-repo-url-tooltip .repo-url-help-diagram__img {
  display: block;
  max-width: 100%;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.create-task-repo-url-tooltip .repo-url-help-diagram__placeholder {
  min-height: 120px;
  padding: 12px;
  text-align: center;
  color: #909399;
  background: #f5f7fa;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  box-sizing: border-box;
}
</style>