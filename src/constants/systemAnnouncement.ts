/** 全局固定公告栏高度（px），需与 ScrollAnnouncement 样式保持一致 */
export const ANNOUNCEMENT_BAR_HEIGHT = 44

export interface SystemAnnouncementConfig {
  /** 是否展示公告 */
  enabled: boolean
  /** 公告文案，多条将分行展示 */
  messages: string[]
}

/** 系统公告配置，可按需修改升级时间与提示内容 */
export const SYSTEM_ANNOUNCEMENT: SystemAnnouncementConfig = {
  enabled: true,
  messages: [
    '【系统升级通知】平台将于 2026年6月10日 22:00 - 24:00 进行系统升级维护。正在执行的扫描任务会出现中断，请提前做好任务安排。如有疑问请联系平台管理员',
  ],
}
