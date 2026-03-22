// import axios from 'axios';
// import service from '@/api/http'; // 

// const VITE_API_REPO_SCAN = import.meta.env.VITE_API_REPO_SCAN
// const VITE_API_REPO_SCAN = 'http://localhost:8662'
// const REPO_SCAN_URL = VITE_API_REPO_SCAN + '/ai_repo_scan_service';

const taskManagementService = {
  // 查询任务列表
  // getRepoScanTasks: (pageNum: number, pageSize: number): any => service.get(`${REPO_SCAN_URL}/api/tasks`, {
  //   pageNum,
  //   pageSize
  // }),

  // 查询任务详情（与 src/api/task.ts 中 getTaskDetail 对应，便于替换调用）
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

  // 保存标注（reqBody 类型见 @/api/task 的 SaveAnnotationReqBody）
  // saveAnnotationApi: (reqBody: SaveAnnotationReqBody): any => {
  //   return service.post(`${REPO_SCAN_URL}/api/annotations`, reqBody)
  // },

  // 获取任务的标注完成度和状态分布统计信息（响应体与 @/api/task 的 ApiEnvelope<AnnotationStatistics> 一致：{ data, meta }）
  // getAnnotationStatistics: (taskId: string): any => service.get(`${REPO_SCAN_URL}/api/tasks/${taskId}/annotation-statistics`),

  // 删除任务
  // deleteTask: (taskId: string): any => {
  //   return service.delete(`${REPO_SCAN_URL}/api/tasks/${taskId}`)
  // },
};

export default taskManagementService;
