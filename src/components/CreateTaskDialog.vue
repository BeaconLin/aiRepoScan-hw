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

      <el-form-item label="扫描助手版本" prop="assistantVersions">
        <div class="assistant-cards-container">
          <div
            v-for="assistant in assistantVersions"
            :key="assistant.value"
            class="assistant-card"
            :class="{ 'selected': formData.assistantVersions.includes(assistant.value) }"
            @click="toggleAssistant(assistant.value)"
          >
            <div class="card-header">
              <div class="card-title">{{ assistant.label }}</div>
              <div class="card-checkbox" :class="{ 'checked': formData.assistantVersions.includes(assistant.value) }">
                <span v-if="formData.assistantVersions.includes(assistant.value)">✓</span>
              </div>
            </div>
            <div class="card-description">{{ assistant.description }}</div>
          </div>
        </div>
        <div class="form-hint">
          提示：可选择多个扫描助手版本
        </div>
      </el-form-item>

      <el-form-item label="代码语言" prop="codeLanguage">
        <el-select
          v-model="formData.codeLanguage"
          placeholder="请选择主要代码语言（对应接口 codeLanguage）"
          clearable
          style="width: 100%"
        >
          <el-option label="Java" value="Java" />
          <el-option label="C++" value="C++" />
          <el-option label="JavaScript" value="JavaScript" />
          <el-option label="TypeScript" value="TypeScript" />
          <el-option label="Python" value="Python" />
          <el-option label="Go" value="Go" />
          <el-option label="未知 / 混合" value="Unknown" />
        </el-select>
      </el-form-item>

      <el-form-item label="代码量(万行)" prop="lineNum">
        <el-input
          v-model="formData.lineNum"
          placeholder="请填写数字（可选）"
          clearable
        />
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

      <el-form-item label="扫描结果文件">
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
              支持上传JSON格式的扫描结果文件（可选），可在创建任务后单独上传
            </div>
          </template>
        </el-upload>
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
import { useProfileStore } from '../stores/userProfile'
import { createTask as createTaskApi, uploadScanResultFile } from '../api/task'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const dialogVisible = ref(false)
const formRef = ref(null)
const uploadRef = ref(null)
const submitting = ref(false)
const userStore = useProfileStore()

// 文件上传相关
const fileList = ref([])
const selectedFile = ref(null)

// 扫描助手版本选项（示例数据，实际应该从接口获取）
const assistantVersions = ref([
  { 
    label: '内存安全扫描', 
    value: 'v1.0.0',
    description: '基础版本，支持常见代码规范检查和安全漏洞扫描'
  },

])

// 表单数据
const formData = reactive({
  taskName: '',
  repoUrl: '',
  branch: '',
  assistantVersions:
    assistantVersions.value.length > 0
      ? [assistantVersions.value[0].value]
      : [],
  scanPaths: '',
  creator: '', // 从用户信息获取
  productName: '', // 默认值
  deptName: '', // 可选
  pduName: '', // 可选
  /** 接口字段 codeLanguage */
  codeLanguage: 'Java',
  /** 接口字段 lineNum（万行），空字符串表示不提交 */
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
  assistantVersions: [
    { 
      required: true, 
      message: '请至少选择一个扫描助手版本', 
      trigger: 'change',
      validator: (rule, value, callback) => {
        if (!value || value.length === 0) {
          callback(new Error('请至少选择一个扫描助手版本'))
        } else {
          callback()
        }
      }
    }
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
  lineNum: [
    {
      validator: (rule, value, callback) => {
        const raw = String(value ?? '').trim()
        if (raw === '') {
          callback()
          return
        }
        const n = Number(raw)
        if (!Number.isFinite(n)) {
          callback(new Error('请输入有效数字'))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
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

// 切换扫描助手选择
const toggleAssistant = (value) => {
  const index = formData.assistantVersions.indexOf(value)
  if (index > -1) {
    formData.assistantVersions.splice(index, 1)
  } else {
    formData.assistantVersions.push(value)
  }
  // 触发验证
  if (formRef.value) {
    formRef.value.validateField('assistantVersions')
  }
}

// 文件变化处理
const handleFileChange = (file) => {
  selectedFile.value = file.raw
}

// 文件移除处理
const handleFileRemove = () => {
  selectedFile.value = null
}

// 初始化表单
const initForm = () => {
  // 重置表单
  formData.taskName = ''
  formData.repoUrl = ''
  formData.branch = ''
  formData.assistantVersions =
    assistantVersions.value.length > 0
      ? [assistantVersions.value[0].value]
      : []
  formData.scanPaths = ''
  formData.productName = ''
  formData.deptName = ''
  formData.pduName = ''
  formData.codeLanguage = 'Java'
  formData.lineNum = ''

  // 从用户信息获取创建人
  const userInfo = userStore.getUserInfo()
  formData.creator = userInfo.w3Id || ''
  formData.createTime = '' // 提交时再获取
  
  // 重置文件上传
  fileList.value = []
  selectedFile.value = null
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
  
  // 清除验证状态
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

// 初始化用户信息
onMounted(() => {
  const userInfo = userStore.getUserInfo()
  formData.creator = userInfo.w3Id || ''
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
    const userInfo = userStore.getUserInfo()

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

    let createResponse
    try {
      createResponse = await createTaskApi({
        taskName: createTaskData.taskName,
        productName: createTaskData.productName,
        repoUrl: createTaskData.repoUrl,
        branch: createTaskData.branch,
        pathList: createTaskData.pathList,
        creator: createTaskData.creator || userInfo.w3Id || '',
        nameCn: userInfo.nameCn || undefined,
        assistantVersions: formData.assistantVersions.join(','),
        codeLanguage: createTaskData.codeLanguage,
        lineNum: createTaskData.lineNum,
        deptName: createTaskData.deptName,
        pduName: createTaskData.pduName
      })
    } catch (e) {
      console.error('创建任务请求失败:', e)
      ElMessage.error(e?.message || '创建任务失败，请稍后重试')
      return
    }

    if (createResponse.code !== 200 || !createResponse.data?.taskId) {
      ElMessage.error(createResponse.message || '任务创建失败')
      return
    }

    const data = createResponse.data

    let s3Path = null

    // 若选择了扫描结果文件，在创建成功后上传（Mock：task.ts）
    if (selectedFile.value) {
      try {
        const uploadResponse = await uploadScanResultFile(
          data.taskId,
          selectedFile.value,
          userInfo.w3Id || formData.creator,
        )
        if (uploadResponse.code === 200 && uploadResponse.data) {
          s3Path = uploadResponse.data
          ElMessage.success('任务创建成功，扫描结果文件已上传！')
        } else {
          ElMessage.warning(
            uploadResponse.message ||
              '任务已创建，但扫描结果文件上传失败，可在任务详情中重新上传',
          )
        }
      } catch (uploadError) {
        console.error('文件上传失败:', uploadError)
        ElMessage.warning('任务已创建，但文件上传失败，您可以在任务详情中重新上传')
      }
    } else {
      ElMessage.success('任务创建成功！')
    }

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
      codeLanguage: formData.codeLanguage || 'Unknown',
      lineNum: lineNumForApi ?? 0,
      productName: data.productName,
      deptName: formData.deptName,
      pduName: formData.pduName,
      taskStatus: data.taskStatus || '未开始',
      scanResults: [],
      s3Path,
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

.assistant-cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  width: 100%;
}

.assistant-card {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.assistant-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
  transform: translateY(-2px);
}

.assistant-card.selected {
  border-color: #3b82f6;
  background: #eff6ff;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-title {
  font-weight: 600;
  font-size: 16px;
  color: #1f2937;
}

.card-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  transition: all 0.2s;
}

.card-checkbox.checked {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #ffffff;
}

.card-checkbox.checked span {
  font-size: 14px;
  font-weight: bold;
}

.card-description {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
  margin-top: 4px;
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
