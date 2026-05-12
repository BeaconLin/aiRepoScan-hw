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
    getTaskInfo as mockGetTaskInfo,
    getTaskScanResults as mockGetTaskScanResults,
    uploadScanResultFile as mockUploadScanResultFile,
    saveAnnotationApi as mockSaveAnnotationApi,
    getAnnotationStatistics as mockGetAnnotationStatistics,
} from '@/api/task'
import taskManagementService from '@/api/services/taskManagementService'
import type {
    AnnotationStatistics,
    ApiEnvelope,
    CreateTaskPayload,
    TaskDetail,
    UpdateTaskInfoPayload,
} from '@/api/types'
import type { SaveAnnotationReqBody, SaveAnnotationResultData } from '@/api/types/saveAnnotation'
import type { TaskListPageData } from '@/api/types/taskList'
import type { TaskInfoApiDocResponse, TaskScanResultsApiDocResponse } from '@/api/types/taskApiDoc'
import type { UploadScanResultFileResponse } from '@/api/types/upload'

export { apiMode } from '@/api/taskManagementApiConfig'
export type { TaskManagementApiMode } from '@/api/taskManagementApiConfig'

export async function queryTaskList(
    pageNum: number,
    pageSize: number,
    creator?: string,
    taskStatus?: string,
    taskName?: string,
): Promise<ApiEnvelope<TaskListPageData>> {
    return apiMode === 'live'
        ? taskManagementService.queryTaskList(pageNum, pageSize, creator, taskStatus, taskName)
        : mockQueryTaskList(pageNum, pageSize, creator, taskStatus, taskName)
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

export async function getTaskInfo(taskId: string): Promise<TaskInfoApiDocResponse> {
    return apiMode === 'live' ? taskManagementService.getTaskInfo(taskId) : mockGetTaskInfo(taskId)
}

export async function getTaskScanResults(
    taskId: string,
    pageNum: number,
    pageSize: number,
    ruleName?: string,
    annotation?: string,
): Promise<TaskScanResultsApiDocResponse> {
    return apiMode === 'live'
        ? taskManagementService.getTaskScanResults(taskId, pageNum, pageSize, ruleName, annotation)
        : mockGetTaskScanResults(taskId, pageNum, pageSize, ruleName, annotation)
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
