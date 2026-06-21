/**
 * 任务管理相关接口统一入口：根据 `apiMode` 在 mock（`task.ts`）与 live（`taskManagementService.ts`）之间切换。
 * 修改 `taskManagementApiConfig.ts` 中的 `apiMode` 即可，无需在页面里改注释或切换函数名。
 */
import { apiMode } from '@/api/taskManagementApiConfig'
import {
    queryTaskList as mockQueryTaskList,
    deleteTaskById as mockDeleteTaskById,
    updateTaskInfo as mockUpdateTaskInfo,
    createTaskApi as mockCreateTaskApi,
    batchCreateTasksApi as mockBatchCreateTasksApi,
    getTaskInfo as mockGetTaskInfo,
    getTaskScanResults as mockGetTaskScanResults,
    uploadScanResultFile as mockUploadScanResultFile,
    saveAnnotationApi as mockSaveAnnotationApi,
    saveAnnotationReviewApi as mockSaveAnnotationReviewApi,
    getAnnotationSubmitHistory as mockGetAnnotationSubmitHistory,
    getAnnotationReviewHistory as mockGetAnnotationReviewHistory,
    getAnnotationTimeline as mockGetAnnotationTimeline,
    getAnnotationStatistics as mockGetAnnotationStatistics,
    rerunStatistics as mockRerunStatistics,
    startTaskScan as mockStartTaskScan,
    pauseTask as mockPauseTask,
    exportTaskScanResultsExcel as mockExportTaskScanResultsExcel,
} from '@/api/task'
import taskManagementService from '@/api/services/taskManagementService'
import type {
    AnnotationStatistics,
    ApiEnvelope,
    CreateTaskPayload,
    BatchCreateTaskPayload,
    BatchCreateTaskData,
    TaskDetail,
    UpdateTaskInfoPayload,
    StartTaskScanData,
    PauseTaskData,
} from '@/api/types'
import type { SaveAnnotationReqBody, SaveAnnotationResultData } from '@/api/types/saveAnnotation'
import type {
    SaveAnnotationReviewReqBody,
    SaveAnnotationReviewResultData,
    SubmitHistoryListData,
    ReviewHistoryListData,
    AnnotationTimelineData,
} from '@/api/types/annotationReview'
import type { TaskListPageData } from '@/api/types/taskList'
import type { TaskInfoApiDocResponse, TaskScanResultsApiDocResponse } from '@/api/types/taskApiDoc'
import type { UploadScanResultFileResponse } from '@/api/types/upload'

export { apiMode } from '@/api/taskManagementApiConfig'
export type { TaskManagementApiMode } from '@/api/taskManagementApiConfig'

export interface ExportScanResultsExcelResult {
    blob: Blob
    fileName?: string
}

export async function queryTaskList(
    pageNum: number,
    pageSize: number,
    creator?: string,
    taskStatus?: string,
    taskName?: string,
    deptName?: string,
    pduName?: string,
): Promise<ApiEnvelope<TaskListPageData>> {
    return apiMode === 'live'
        ? taskManagementService.queryTaskList(pageNum, pageSize, creator, taskStatus, taskName, deptName, pduName)
        : mockQueryTaskList(pageNum, pageSize, creator, taskStatus, taskName, deptName, pduName)
}

export async function deleteTaskById(taskId: string): Promise<ApiEnvelope<boolean>> {
    return apiMode === 'live'
        ? taskManagementService.deleteTaskById(taskId)
        : mockDeleteTaskById(taskId)
}

export async function updateTaskInfo(
    taskId: string,
    payload: UpdateTaskInfoPayload,
): Promise<ApiEnvelope<null>> {
    return apiMode === 'live'
        ? taskManagementService.updateTaskInfo(taskId, payload)
        : mockUpdateTaskInfo(taskId, payload)
}

/** 创建任务（弹窗等复用；与 `task.ts` 中 `createTaskApi` 对齐） */
export async function createTaskApi(payload: CreateTaskPayload): Promise<ApiEnvelope<TaskDetail>> {
    return apiMode === 'live'
        ? taskManagementService.createTaskApi(payload)
        : mockCreateTaskApi(payload)
}

/** 批量创建任务（POST `/api/tasks/batch`） */
export async function batchCreateTasksApi(
    payload: BatchCreateTaskPayload,
): Promise<ApiEnvelope<BatchCreateTaskData>> {
    return apiMode === 'live'
        ? taskManagementService.batchCreateTasksApi(payload)
        : mockBatchCreateTasksApi(payload)
}

export async function getTaskInfo(taskId: string): Promise<TaskInfoApiDocResponse> {
    return apiMode === 'live' ? taskManagementService.getTaskInfo(taskId) : mockGetTaskInfo(taskId)
}

export async function getTaskScanResults(
    taskId: string,
    pageNum: number,
    pageSize: number,
    ruleName?: string,
    annotation?: string,
    reviewStatus?: string,
): Promise<TaskScanResultsApiDocResponse> {
    return apiMode === 'live'
        ? taskManagementService.getTaskScanResults(taskId, pageNum, pageSize, ruleName, annotation, reviewStatus)
        : mockGetTaskScanResults(taskId, pageNum, pageSize, ruleName, annotation, reviewStatus)
}

export async function uploadScanResultFile(
    taskId: string,
    file: File,
    userId: string,
): Promise<UploadScanResultFileResponse> {
    return apiMode === 'live'
        ? taskManagementService.uploadScanResultFile(taskId, file, userId)
        : mockUploadScanResultFile(taskId, file, userId)
}

export async function saveAnnotationApi(
    reqBody: SaveAnnotationReqBody,
): Promise<ApiEnvelope<SaveAnnotationResultData | null>> {
    return apiMode === 'live'
        ? taskManagementService.saveAnnotationApi(reqBody)
        : mockSaveAnnotationApi(reqBody)
}

export async function getAnnotationStatistics(
    taskId: string,
): Promise<ApiEnvelope<AnnotationStatistics>> {
    return apiMode === 'live'
        ? taskManagementService.getAnnotationStatistics(taskId)
        : mockGetAnnotationStatistics(taskId)
}

/** 重新统计规则分布（POST `/api/tasks/{taskId}/rerunStatistics?userId`） */
export async function rerunStatistics(
    taskId: string,
    userId: string,
): Promise<ApiEnvelope<null>> {
    return apiMode === 'live'
        ? taskManagementService.rerunStatistics(taskId, userId)
        : mockRerunStatistics(taskId, userId)
}

/** 启动扫描（POST `/api/tasks/{taskId}/start`） */
export async function startTaskScan(taskId: string): Promise<ApiEnvelope<StartTaskScanData>> {
    return apiMode === 'live'
        ? taskManagementService.startTaskScan(taskId)
        : mockStartTaskScan(taskId)
}

/** 暂停任务（POST `/api/tasks/{taskId}/pause`） */
export async function pauseTask(taskId: string): Promise<ApiEnvelope<PauseTaskData>> {
    return apiMode === 'live'
        ? taskManagementService.pauseTask(taskId)
        : mockPauseTask(taskId)
}

/** 保存缺陷标注评审（POST `/api/annotations/review`） */
export async function saveAnnotationReviewApi(
    reqBody: SaveAnnotationReviewReqBody,
    reviewer?: { userId: string; userName?: string | null },
): Promise<ApiEnvelope<SaveAnnotationReviewResultData | null>> {
    if (apiMode === 'live') {
        return taskManagementService.saveAnnotationReviewApi(reqBody)
    }
    return mockSaveAnnotationReviewApi(
        reqBody,
        reviewer?.userId ?? 'r00123456',
        reviewer?.userName ?? null,
    )
}

export async function getAnnotationSubmitHistory(
    taskId: string,
    warnUuid: string,
): Promise<ApiEnvelope<SubmitHistoryListData>> {
    return apiMode === 'live'
        ? taskManagementService.getAnnotationSubmitHistory(taskId, warnUuid)
        : mockGetAnnotationSubmitHistory(taskId, warnUuid)
}

export async function getAnnotationReviewHistory(
    taskId: string,
    warnUuid: string,
): Promise<ApiEnvelope<ReviewHistoryListData>> {
    return apiMode === 'live'
        ? taskManagementService.getAnnotationReviewHistory(taskId, warnUuid)
        : mockGetAnnotationReviewHistory(taskId, warnUuid)
}

export async function getAnnotationTimeline(
    taskId: string,
    warnUuid: string,
): Promise<ApiEnvelope<AnnotationTimelineData>> {
    return apiMode === 'live'
        ? taskManagementService.getAnnotationTimeline(taskId, warnUuid)
        : mockGetAnnotationTimeline(taskId, warnUuid)
}

/** 导出任务扫描结果 Excel（GET `/api/tasks/{taskId}/export-excel`） */
export async function exportTaskScanResultsExcel(
    taskId: string,
): Promise<ExportScanResultsExcelResult> {
    return apiMode === 'live'
        ? taskManagementService.exportTaskScanResultsExcel(taskId)
        : mockExportTaskScanResultsExcel(taskId)
}
