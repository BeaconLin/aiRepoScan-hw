<template>
  <el-dialog
      v-model="dialogVisible"
      title="创建代码仓扫描任务"
      width="800px"
      :close-on-click-modal="false"
      @close="handleClose"
  >
    <div class="dialog-body-scroll">
      <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-width="120px"
          label-position="right"
      >
        <el-form-item label="任务名称" prop="taskName">
          <el-input
              v-model="formData.taskName"
              placeholder="请输入任务名称"
              clearable
          />
        </el-form-item>

        <el-form-item label="代码仓URL" prop="repoUrl">
          <el-input
              v-model="formData.repoUrl"
              placeholder="请输入代码仓URL，例如：https://github.com/user/repo.git"
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

        <el-form-item label="扫描路径" prop="scanPaths">
          <el-input
              v-model="formData.scanPaths"
              placeholder="可选，多个路径使用英文逗号分隔，例如：src,view,utils"
              clearable
          />
          <div class="form-hint">
            可选；填写时多个路径用英文逗号拼接，例如：src,view,utils；不填则不传 pathList
          </div>
        </el-form-item>

        <el-form-item label="代码语言" prop="codeLanguage">
          <el-select
              v-model="formData.codeLanguage"
              placeholder="C/C++"
              style="width: 100%"
          >
            <el-option label="C/C++" value="C++" />
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

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          提交创建
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useProfileStore } from '@/stores/userProfile'
import { createTaskApi } from '@/api/task'
import taskManagementService from '@/api/services/taskManagementService'

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
const submitting = ref(false)

const DEFAULT_CODE_LANGUAGE = 'C/C++'

const formData = reactive({
  taskName: '',
  repoUrl: '',
  branch: '',
  assistantVersions: [],
  scanPaths: '',
  creator: '', // 从用户信息获取
  productName: '', // 默认值
  deptName: '', // 可选
  pduName: '', // 可选
  codeLanguage: DEFAULT_CODE_LANGUAGE,
  lineNum: '',
  createTime: '' // 实际应该自动填充当前时间
})

// 表单验证规则
const rules = {
  taskName: [
    { required: true, message: '请输入任务名称', trigger: 'blur' },
    { min: 2, max: 50, message: '任务名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  repoUrl: [
    { required: true, message: '请输入代码仓URL', trigger: 'blur' },
    {
      pattern: /^(https?|git):\/\/.+/,
      message: '请输入有效的代码仓URL',
      trigger: 'blur'
    }
  ],
  branch: [
    { required: true, message: '请输入扫描分支', trigger: 'blur' }
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
    { required: true, message: '请输入产品名称', trigger: 'blur' }
  ],
}

// 监听 modelValue 变化
watch(
    () => props.modelValue,
    (newVal) => {
      dialogVisible.value = newVal
      if (newVal) {
        initForm()
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
  formData.assistantVersions = []
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
  if (formRef.value) {
    formRef.value.clearValidate()
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

    // 构建创建任务的请求数据（与《接口文档》1.5 创建代码仓扫描任务一致）
    const createTaskData = {
      taskName: formData.taskName.trim(),
      productName: formData.productName.trim(),
      repoUrl: formData.repoUrl.trim(),
      branch: formData.branch.trim(),
      pathList:
          validScanPaths.length > 0 ? validScanPaths.join(',') : undefined,
      creator: formData.creator || userInfo.w3Id,
      assistantVersions: formData.assistantVersions.join(','),
      codeLanguage: formData.codeLanguage || undefined,
      lineNum: lineNumForApi,
      deptName: formData.deptName?.trim() || undefined,
      pduName: formData.pduName?.trim() || undefined,
    }

    const createTaskPayload = {
      ...createTaskData,
      creator: createTaskData.creator || userInfo.w3Id || '',
      nameCn: userInfo.nameCn || undefined,
    }

    let createResponse
    try {
      createResponse = await createTaskApi(createTaskPayload)
      // createResponse = await taskManagementService.createTaskApi(createTaskPayload)
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
      taskStatus: data.taskStatus || '未开始',
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

.form-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>