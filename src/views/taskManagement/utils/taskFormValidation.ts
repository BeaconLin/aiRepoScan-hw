import type { FormRules } from 'element-plus'

/** 仅允许 HTTPS Git 克隆地址：https://主机/路径.git */
export function isValidRepoGitUrl(raw: unknown): boolean {
  const url = String(raw ?? '').trim()
  if (!url) return false
  return /^https:\/\/[^\s/]+\/[^\s?]+\.git$/i.test(url)
}

function createPathListValidator() {
  return {
    validator: (_rule: unknown, value: unknown, callback: (err?: Error) => void) => {
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
    trigger: 'blur' as const,
  }
}

const repoUrlRules = [
  { required: true, message: '请输入代码仓Git地址', trigger: 'blur' },
  {
    validator: (_rule: unknown, value: unknown, callback: (err?: Error) => void) => {
      if (!value || String(value).trim() === '') {
        callback()
        return
      }
      if (isValidRepoGitUrl(value)) {
        callback()
      } else {
        callback(
          new Error('请输入有效的 HTTPS Git 克隆地址，如 https://主机/组织/项目.git'),
        )
      }
    },
    trigger: 'blur' as const,
  },
]

const sharedTaskFormRules = {
  taskName: [
    { required: true, message: '请输入任务名称', trigger: 'blur' },
    { min: 2, max: 50, message: '任务名称长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  repoUrl: repoUrlRules,
  branch: [{ required: true, message: '请输入扫描分支', trigger: 'blur' }],
  productName: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
}

/** 任务详情页编辑表单校验 */
export const taskEditFormRules: FormRules = {
  ...sharedTaskFormRules,
  pathList: [createPathListValidator()],
}

/** 创建任务弹窗表单校验（扫描路径字段名为 scanPaths） */
export const createTaskFormRules: FormRules = {
  ...sharedTaskFormRules,
  scanPaths: [createPathListValidator()],
}
