// import axios from 'axios';
// import service from '@/api/http';
// import type { UpdateTaskInfoPayload } from '@/api/types';

// const VITE_API_REPO_SCAN = import.meta.env.VITE_API_REPO_SCAN
// const VITE_API_REPO_SCAN = 'http://localhost:8662'
// const REPO_SCAN_URL = VITE_API_REPO_SCAN + '/ai_repo_scan_service';

const taskManagementService = {
  // 查询任务列表
  // queryTaskList: (pageNum: number, pageSize: number, creator?: string, taskStatus?: string, taskName?: string): any => service.get(`${REPO_SCAN_URL}/api/tasks`, {
  //   pageNum,
  //   pageSize,
  //   ...creator && { creator }, // 如果提供了creator参数，则添加到请求中
  //   ...taskStatus && { taskStatus }, // 如果提供了taskStatus参数，则添加到请求中
  //   ...taskName && { taskName } // 如果提供了taskName参数，则添加到请求中
  // }),

  // 查询任务基本信息
  // getTaskInfo: (taskId: string): any => service.get(`${REPO_SCAN_URL}/api/tasks/${taskId}/info`),
  // 查询任务扫描结果
  // getTaskScanResults: (taskId: string, pageNum: number, pageSize: number, ruleName?: string, annotation?: string): any => service.get(`${REPO_SCAN_URL}/api/tasks/${taskId}/scan-results`, {
  //   pageNum,
  //   pageSize,
  //   ...ruleName && { ruleName },
  //   ...annotation && { annotation }
  // }),
  // 查询任务详情（与 src/api/task.ts 中 getTaskDetail 对应；响应 ApiEnvelope<TaskDetail>：{ data, meta }）
  // getTaskDetail: (taskId: string, pageNum: number, pageSize: number): any => service.get(`${REPO_SCAN_URL}/api/tasks/${taskId}`, {
  //   pageNum,
  //   pageSize
  // }),

  // 创建代码仓扫描任务
  // createTask: (taskData: {
  //   taskName: string,
  //   productName: string,
  //   repoUrl: string,
  //   branch: string,
  //   pathList: string,
  //   creator: string,
  //   assistantVersions: string,
  //   codeLanguage: string,
  //   lineNum: number,
  //   deptName?: string,
  //   pduName?: string
  // }): any => {
  //   return service.post(`${REPO_SCAN_URL}/api/tasks`, taskData)
  // },

  // 上传代码仓扫描结果文件到S3存储
  // uploadScanResultFile: (taskId: string, file: File, userId: string): any => {
  //   const formData = new FormData()
  //   formData.append('file', file)
  //   formData.append('userId', userId)
  //   return axios.post(`${REPO_SCAN_URL}/api/tasks/${taskId}/uploadDataSet`, formData, {
  //     headers: {
  //       'Content-Type': 'multipart/form-data'
  //     }
  //   })
  // },

  // 保存标注（reqBody：SaveAnnotationReqBody；响应 ApiEnvelope<null>：{ data, meta }）
  // saveAnnotationApi: (reqBody: SaveAnnotationReqBody): any => {
  //   return service.post(`${REPO_SCAN_URL}/api/annotations`, reqBody)
  // },

  // 获取任务的标注完成度和状态分布统计信息（响应体与 @/api/task 的 ApiEnvelope<AnnotationStatistics> 一致：{ data, meta }）
  // getAnnotationStatistics: (taskId: string): any => service.get(`${REPO_SCAN_URL}/api/tasks/${taskId}/annotation-statistics`),

  // 删除任务
  // deleteTaskById: (taskId: string): any => {
  //   return service.delete(`${REPO_SCAN_URL}/api/tasks/${taskId}`)
  // },

  /**
   * 更新任务信息（接口文档 1.8；请求体为 UpdateTaskInfoPayload）
   * 注意：文档 1.8 中 URL 误写为 `/api/tasks/{taskId}/annotation-statistics`，实际应为：
   * `PUT ${REPO_SCAN_URL}/api/tasks/{taskId}`
   */
  // updateTaskInfo: (taskId: string, body: UpdateTaskInfoPayload): any =>
  //   service.put(`${REPO_SCAN_URL}/api/tasks/${taskId}`, body),
};

export default taskManagementService;
