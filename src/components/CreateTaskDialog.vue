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
        <div class="scan-paths-container">
          <div
            v-for="(path, index) in formData.scanPaths"
            :key="index"
            class="path-item"
          >
            <el-input
              v-model="formData.scanPaths[index]"
              :placeholder="`请输入扫描路径 ${index + 1}`"
              clearable
            >
              <template #append>
                <el-button
                  :disabled="formData.scanPaths.length <= 1"
                  @click="removePath(index)"
                  type="danger"
                >
                  删除
                </el-button>
              </template>
            </el-input>
          </div>
          <el-button
            type="primary"
            @click="addPath"
            style="width: 100%"
            plain
          >
            + 添加扫描路径
          </el-button>
          <div class="form-hint">
            提示：可添加多个扫描路径，每个路径占一行
          </div>
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
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const dialogVisible = ref(false)
const formRef = ref(null)
const submitting = ref(false)

// 扫描助手版本选项（示例数据，实际应该从接口获取）
const assistantVersions = ref([
  { 
    label: 'v1.0.0', 
    value: 'v1.0.0',
    description: '基础版本，支持常见代码规范检查和安全漏洞扫描'
  },
  { 
    label: 'v1.1.0', 
    value: 'v1.1.0',
    description: '增强版本，新增性能优化建议和代码质量分析'
  },
  { 
    label: 'v2.0.0', 
    value: 'v2.0.0',
    description: '最新版本，支持AI智能分析，提供更精准的问题定位和建议'
  },
  { 
    label: 'v2.1.0', 
    value: 'v2.1.0',
    description: '专业版本，支持多语言深度分析和架构设计建议'
  }
])

// 表单数据
const formData = reactive({
  taskName: '',
  repoUrl: '',
  branch: '',
  assistantVersions: [], // 改为数组，支持多选
  scanPaths: [''],
  creator: '当前用户', // 实际应该从用户信息获取
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
        if (!value || value.length === 0) {
          callback(new Error('至少需要添加一个扫描路径'))
        } else if (value.some(path => !path || path.trim() === '')) {
          callback(new Error('扫描路径不能为空'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
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

// 初始化表单
const initForm = () => {
  // 重置表单
  formData.taskName = ''
  formData.repoUrl = ''
  formData.branch = ''
  formData.assistantVersions = []
  formData.scanPaths = ['']
  
  // 自动填充创建人（创建时间在提交时获取）
  formData.creator = '当前用户' // 实际应该从用户信息获取
  formData.createTime = '' // 提交时再获取
  
  // 清除验证状态
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

// 添加扫描路径
const addPath = () => {
  formData.scanPaths.push('')
}

// 删除扫描路径
const removePath = (index) => {
  if (formData.scanPaths.length > 1) {
    formData.scanPaths.splice(index, 1)
  }
}

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
  if (!formRef.value) return

  try {
    // 验证表单
    await formRef.value.validate()
    
    submitting.value = true
    
    // 过滤空的扫描路径
    const validScanPaths = formData.scanPaths.filter(path => path && path.trim() !== '')
    
    // 提交时获取当前时间
    const currentTime = getCurrentTime()
    
    // 构建提交数据（使用新字段名）
    const submitData = {
      taskName: formData.taskName,
      repoUrl: formData.repoUrl,
      branch: formData.branch,
      assistantVersions: formData.assistantVersions,
      pathList: validScanPaths, // 使用pathList替代scanPaths
      creator: formData.creator,
      createTime: currentTime, // 提交时获取的时间
      codeLanguage: 'Unknown', // 默认值，实际应该从扫描结果获取
      lineNum: 0, // 默认值，实际应该从扫描结果获取
      productName: 'UDM', // 默认值，实际应该从用户信息获取
      scanResults: [] // 初始为空数组
    }
    
    // TODO: 调用API创建任务
    console.log('提交数据:', submitData)
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('任务创建成功！')
    
    // 触发成功事件
    emit('success', submitData)
    
    // 关闭弹窗
    handleClose()
  } catch (error) {
    console.error('表单验证失败:', error)
    ElMessage.error('请检查表单输入是否正确')
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

.scan-paths-container {
  width: 100%;
}

.path-item {
  margin-bottom: 12px;
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
