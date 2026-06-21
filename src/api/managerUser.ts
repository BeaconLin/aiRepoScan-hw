/**
 * 用户登录 / 权限相关 live 接口占位。
 * mock 模式下 store 不会调用此处方法；接入真实环境时请补全 URL 与响应类型。
 */
import service from '@/api/http';

export interface ManagerUserInfoResult {
  uid: string;
  displayNameEN: string;
  displayNameCN: string;
  mail?: string;
}

export interface ManagerAdminInfoItem {
  sAMAccountName?: string;
  id?: string;
  title?: string;
  hwDepartName5?: string;
  hwDepartName6?: string;
}

export interface ManagerAdminInfoResult {
  code: number;
  data: ManagerAdminInfoItem[];
}

export const managerUserService = {
  getUserInfo(): Promise<ManagerUserInfoResult | null> {
    return service.getWithCookie('/manager/user/info') as Promise<ManagerUserInfoResult | null>;
  },

  getAdminInfo(userId: string): Promise<ManagerAdminInfoResult | null> {
    return service.get('/manager/user/admin', { userId }) as Promise<ManagerAdminInfoResult | null>;
  },
};
