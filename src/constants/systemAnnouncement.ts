/** 系统公告配置 */
export interface SystemAnnouncementConfig {
  enabled: boolean
  messages: string[]
}

export const SYSTEM_ANNOUNCEMENT: SystemAnnouncementConfig = {
  enabled: true,
  messages: [
    '【系统升级通知】平台将于 2026年6月11日（周四） 22:00 - 24:00 进行系统升级维护。正在执行的扫描任务会出现中断重扫的情况，请保持本地服务启动。如有疑问请联系平台管理员',
  ],
}

/** 公告展示形态版本，变更后已关闭状态会重置 */
export const SYSTEM_ANNOUNCEMENT_VERSION = 'header-v1'

export const SYSTEM_ANNOUNCEMENT_DISMISS_KEY = `system-announcement-${SYSTEM_ANNOUNCEMENT_VERSION}-dismissed`
