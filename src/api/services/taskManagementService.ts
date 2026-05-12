import axios from 'axios';
import service from '@/api/http.ts';
import type { UpdateTaskInfoPayload } from '@/api/types';

// const VITE_API_REPO_SCAN = import.meta.env.VITE_API_REPO_SCAN
const VITE_API_REPO_SCAN = 'http://localhost:8662'

const REPO_SCAN_URL = VITE_API_REPO_SCAN + '/ai_repo_scan_service';
const taskManagementService = {
  queryTaskList: (pageNum: number, pageSize: number, creator?: string, taskStatus?: string, taskName?: string): any => service.get(`${REPO_SCAN_URL}/api/tasks`, {
    pageNum,
    pageSize,
    ...creator && {creator}, // 如果提供了creator参数，则添加到请求中
    ...taskStatus && {taskStatus}, // 如果提供了taskStatus参数，则添加到请求中
    ...taskName && {taskName} // 如果提供了taskName参数，则添加到请求中
  }),
  getTaskDetail: (taskId: string, pageNum: number, pageSize: number): any => service.get(`${REPO_SCAN_URL}/api/tasks/${taskId}`, {
    pageNum,
    pageSize
  }),
  // 查询任务基本信息
  getTaskInfo: (taskId: string): any => service.get(`${REPO_SCAN_URL}/api/tasks/${taskId}/info`),
  // 查询任务扫描结果
  getTaskScanResults: (taskId: string, pageNum: number, pageSize: number, ruleName?: string, annotation?: string): any => service.get(`${REPO_SCAN_URL}/api/tasks/${taskId}/scan-results`, {
    pageNum,
    pageSize,
    ...ruleName && {ruleName},
    ...annotation && {annotation}
  }),
  saveAnnotationApi: (reqBody: any): any => {
    return service.post(`${REPO_SCAN_URL}/api/annotations`, reqBody)
  },
  /**
   * 创建代码仓扫描任务
   * @param taskData 任务数据
   * @returns Promise 返回创建结果，包含taskId等信息
   */
  createTaskApi: (taskData: {
    taskName: string;
    productName: string;
    repoUrl: string;
    branch: string;
    pathList: string;
    creator: string;
    assistantVersions: string;
    codeLanguage?: string;
    deptName?: string;
    pduName?: string;
    lineNum?: number;
  }): any => {
    return service.post(`${REPO_SCAN_URL}/api/tasks`, taskData);
  },
  // 上传代码仓扫描结果文件到S3存储
  uploadScanResultFile: (taskId: string, file: File, userId: string): any => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', userId)
    return axios.post(`${REPO_SCAN_URL}/api/tasks/${taskId}/uploadDataSet`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  // 获取任务的标注完成度和状态分布统计信息
  getAnnotationStatistics: (taskId: string): any => service.get(`${REPO_SCAN_URL}/api/tasks/${taskId}/annotation-statistics`),
  deleteTaskById: (taskId: string): any => service.delete(`${REPO_SCAN_URL}/api/tasks/${taskId}`),
  updateTaskInfo: (taskId: string, body: UpdateTaskInfoPayload): any =>
    service.put(`${REPO_SCAN_URL}/api/tasks/${taskId}`, body),
};

export default taskManagementService;