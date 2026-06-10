import axios, { AxiosResponse } from 'axios';
import service from '@/api/http';
import { getRepoScanServiceBaseUrl } from '@/api/taskManagementApiConfig';
import type { CreateTaskPayload, UpdateTaskInfoPayload } from '@/api/types';

const REPO_SCAN_URL = getRepoScanServiceBaseUrl();

function parseContentDispositionFilename(contentDisposition: string | undefined): string | undefined {
  if (!contentDisposition) {
    return undefined;
  }
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;\n]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      return utf8Match[1].trim();
    }
  }
  const plainMatch = contentDisposition.match(/filename="?([^";\n]+)"?/i);
  if (plainMatch?.[1]) {
    return plainMatch[1].trim();
  }
  return undefined;
}

async function readBlobErrorMessage(blob: Blob): Promise<string> {
  try {
    const text = await blob.text();
    const json = JSON.parse(text) as { meta?: { message?: string }; message?: string };
    return json.meta?.message || json.message || '导出失败，请稍后重试';
  } catch {
    return '导出失败，请稍后重试';
  }
}
const taskManagementService = {
  queryTaskList: (pageNum: number, pageSize: number, creator?: string, taskStatus?: string, taskName?: string, deptName?: string, pduName?: string): any => service.get(`${REPO_SCAN_URL}/api/tasks`, {
    pageNum,
    pageSize,
    ...creator && {creator},
    ...taskStatus && {taskStatus},
    ...taskName && {taskName},
    ...deptName && {deptName},
    ...pduName && {pduName},
  }),
  getTaskDetail: (taskId: string, pageNum: number, pageSize: number): any => service.get(`${REPO_SCAN_URL}/api/tasks/${taskId}`, {
    pageNum,
    pageSize
  }),
  // 查询任务基本信息
  getTaskInfo: (taskId: string): any => service.get(`${REPO_SCAN_URL}/api/tasks/${taskId}/info`),
  // 查询任务扫描结果
  getTaskScanResults: (taskId: string, pageNum: number, pageSize: number, ruleName?: string, annotation?: string, reviewStatus?: string): any => service.get(`${REPO_SCAN_URL}/api/tasks/${taskId}/scan-results`, {
    pageNum,
    pageSize,
    ...ruleName && {ruleName},
    ...annotation && {annotation},
    ...reviewStatus && {reviewStatus}
  }),
  saveAnnotationApi: (reqBody: any): any => {
    return service.post(`${REPO_SCAN_URL}/api/annotations`, reqBody)
  },
  /**
   * 创建代码仓扫描任务
   * @param taskData 任务数据
   * @returns Promise 返回创建结果，包含taskId等信息
   */
  createTaskApi: (taskData: CreateTaskPayload): any => {
    return service.post(`${REPO_SCAN_URL}/api/tasks`, taskData);
  },
  /** 批量创建代码仓扫描任务 */
  batchCreateTasksApi: (payload: {
    creator: string;
    nameCn?: string;
    tasks: Array<{
      taskName: string;
      productName: string;
      repoUrl: string;
      branch: string;
      pathList?: string;
      assistantVersions?: string;
      codeLanguage?: string;
      lineNum?: number;
      deptName?: string;
      pduName?: string;
      hostUrl?: string;
      modelName?: string;
    }>;
  }): any => service.post(`${REPO_SCAN_URL}/api/tasks/batch`, payload),
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
  /** 重新统计规则分布（POST `/api/tasks/{taskId}/rerunStatistics?userId`） */
  rerunStatistics: (taskId: string, userId: string): any =>
    service.post(`${REPO_SCAN_URL}/api/tasks/${taskId}/rerunStatistics`, {}, { userId }),
  deleteTaskById: (taskId: string): any => service.delete(`${REPO_SCAN_URL}/api/tasks/${taskId}`),
  updateTaskInfo: (taskId: string, body: UpdateTaskInfoPayload): any =>
    service.put(`${REPO_SCAN_URL}/api/tasks/${taskId}`, body),
  /** 启动代码仓扫描任务 */
  startTaskScan: (taskId: string): any =>
    service.post(`${REPO_SCAN_URL}/api/tasks/${taskId}/start`, {}),
  /** 保存缺陷标注评审结果 */
  saveAnnotationReviewApi: (reqBody: {
    taskId: string
    warnUuid: string
    decision: 'approve' | 'reject'
    comment?: string
    finalIssueResult?: number
  }): any => service.post(`${REPO_SCAN_URL}/api/annotations/review`, reqBody),
  getAnnotationSubmitHistory: (taskId: string, warnUuid: string): any =>
    service.get(`${REPO_SCAN_URL}/api/tasks/${taskId}/annotations/${warnUuid}/submit-history`),
  getAnnotationReviewHistory: (taskId: string, warnUuid: string): any =>
    service.get(`${REPO_SCAN_URL}/api/tasks/${taskId}/annotations/${warnUuid}/review-history`),
  getAnnotationTimeline: (taskId: string, warnUuid: string): any =>
    service.get(`${REPO_SCAN_URL}/api/tasks/${taskId}/annotations/${warnUuid}/timeline`),
  /** 导出任务扫描结果 Excel（GET `/api/tasks/{taskId}/export-excel`） */
  exportTaskScanResultsExcel: async (taskId: string): Promise<{ blob: Blob; fileName?: string }> => {
    let response: AxiosResponse<Blob>;
    try {
      response = await axios.get(`${REPO_SCAN_URL}/api/tasks/${taskId}/export-excel`, {
        responseType: 'blob',
      });
    } catch (error: unknown) {
      const axiosErr = error as { response?: { data?: Blob } };
      if (axiosErr.response?.data instanceof Blob) {
        throw new Error(await readBlobErrorMessage(axiosErr.response.data));
      }
      throw error;
    }

    const blob = response.data;
    if (blob.type.includes('application/json')) {
      throw new Error(await readBlobErrorMessage(blob));
    }

    const fileName = parseContentDispositionFilename(response.headers['content-disposition']);
    return { blob, fileName };
  },
};

export default taskManagementService;