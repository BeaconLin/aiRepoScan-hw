/**
 * 任务管理数据源切换：仅改此处 `apiMode` 即可在本地 mock 与真实接口之间切换，
 * 业务页面统一从 `@/api/taskManagementApi` 引用方法，无需再改注释或切换调用语句。
 */
export type TaskManagementApiMode = 'mock' | 'live'

export const apiMode: TaskManagementApiMode = 'mock'

/**
 * 仓库扫描 HTTP 服务根路径（末尾不含 `/`）。
 * - 配置了 `VITE_API_REPO_SCAN` 时：`{VITE_API_REPO_SCAN}/ai_repo_scan_service`（与历史 `taskManagementService` 注释一致）
 * - 未配置时：使用同源相对路径 `/ai_repo_scan_service`，便于在 `vite.config` 里做 dev 代理，无需先写 .env
 */
export function getRepoScanServiceBaseUrl(): string {
    const v = import.meta.env.VITE_API_REPO_SCAN as string | undefined
    const trimmed = (v || '').trim().replace(/\/+$/, '')
    if (!trimmed) {
        if (import.meta.env.DEV) {
            console.warn(
                '[taskManagement] 未配置 VITE_API_REPO_SCAN，live 请求将发往当前站点下的 /ai_repo_scan_service；直连后端时请配置该变量。',
            )
        }
        return '/ai_repo_scan_service'
    }
    return `${trimmed}/ai_repo_scan_service`
}
