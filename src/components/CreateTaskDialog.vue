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
          placeholder="请输入扫描路径，多个路径使用英文逗号分隔，例如：src,view,utils"
          clearable
        />
        <div class="form-hint">
          提示：多个路径使用英文逗号进行拼接，例如：src,view,utils
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
import { userProfileStore } from '../stores/userProfile'
import taskManagementService from '../api/taskManagementService'

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
const userStore = userProfileStore()

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
  assistantVersions: [], // 改为数组，支持多选
  scanPaths: '',
  creator: '', // 从用户信息获取
  productName: '', // 默认值
  deptName: '', // 可选
  pduName: '', // 可选
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
    { required: true, message: '请输入扫描路径', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value || value.trim() === '') {
          callback(new Error('请输入扫描路径'))
        } else {
          // 按逗号分割并过滤空值
          const paths = value.split(',').map(path => path.trim()).filter(path => path !== '')
          if (paths.length === 0) {
            callback(new Error('至少需要输入一个有效的扫描路径'))
          } else {
            callback()
          }
        }
      },
      trigger: 'blur'
    }
  ],
  productName: [
    { required: true, message: '请输入产品名称', trigger: 'blur' }
  ]
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

// 获取当前时间格式化字符串
const getCurrentTime = () => {
  return new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
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
  formData.assistantVersions = []
  formData.scanPaths = ''
  formData.productName = ''
  formData.deptName = ''
  formData.pduName = ''
  
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
    
    // 提交时获取当前时间
    const currentTime = getCurrentTime()
    
    // 获取用户信息
    const userInfo = userStore.getUserInfo()
    
    // 构建创建任务的请求数据（根据接口文档格式）
    const createTaskData = {
      taskName: formData.taskName,
      productName: formData.productName,
      repoUrl: formData.repoUrl,
      branch: formData.branch,
      pathList: validScanPaths.join(','), // 接口要求是逗号分隔的字符串
      creator: formData.creator || userInfo.w3Id,
      assistantVersions: formData.assistantVersions.join(','), // 接口要求是字符串，多个版本用逗号分隔
      codeLanguage: 'Unknown', // 默认值，实际应该从扫描结果获取
      lineNum: 0, // 默认值，实际应该从扫描结果获取
      deptName: formData.deptName || undefined,
      pduName: formData.pduName || undefined
    }
    
    // 调用创建任务接口（接口已定义，这里模拟调用）
    console.log('创建任务请求数据:', createTaskData)
    // const createResponse = await taskManagementService.createTask(createTaskData)
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟返回的任务ID（实际应该从接口响应中获取）
    const mockTaskId = `task_${Date.now()}`
    
    // 如果选择了文件，则上传扫描结果文件
    if (selectedFile.value) {
      try {
        console.log('开始上传扫描结果文件:', selectedFile.value.name)
        // const uploadResponse = await taskManagementService.uploadScanResultFile(
        //   mockTaskId,
        //   selectedFile.value,
        //   userInfo.w3Id
        // )
        
        // 模拟上传
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log('文件上传成功')
        ElMessage.success('任务创建成功，扫描结果文件已上传！')
      } catch (uploadError) {
        console.error('文件上传失败:', uploadError)
        ElMessage.warning('任务创建成功，但文件上传失败，您可以在任务详情中重新上传')
      }
    } else {
      ElMessage.success('任务创建成功！')
    }
    
    // 构建返回给父组件的数据（用于更新任务列表）
    const submitData = {
      taskId: mockTaskId,
      taskName: formData.taskName,
      repoUrl: formData.repoUrl,
      branch: formData.branch,
      assistantVersions: formData.assistantVersions,
      pathList: validScanPaths,
      creator: formData.creator || userInfo.w3Id,
      createTime: currentTime,
      codeLanguage: 'Unknown',
      lineNum: 0,
      productName: formData.productName,
      deptName: formData.deptName,
      pduName: formData.pduName,
      taskStatus: '未开始',
      scanResults: [],
      s3Path: selectedFile.value ? `AIRepoScan/${mockTaskId}/scan_result.json` : null
    }
    
    // 触发成功事件
    emit('success', submitData)
    
    // 关闭弹窗
    handleClose()
  } catch (error) {
    console.error('表单验证失败:', error)
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
