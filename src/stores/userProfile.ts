import { reactive } from 'vue';
import { defineStore } from 'pinia';
import { managerUserService } from '@/api/managerUser';

interface UserInfo {
  w3Id: string;
  name: string;
  nameCn: string;
  dept: string;
  email: string;
  createTime: string;
  nameAndId: string;
  avatar?: string;
  role?: string;
  hwDepartName5?: string;
  hwDepartName6?: string;
}

interface UserPermission {
  isAdmin: boolean;
  owner: boolean;
}

/** 开发环境或显式开启 VITE_USER_MOCK 时使用本地默认用户，不请求接口 */
const USE_MOCK_USER =
  import.meta.env.DEV || import.meta.env.VITE_USER_MOCK === 'true';

const DEFAULT_MOCK_USER: UserInfo = {
  w3Id: 't00598420',
  name: 'tianyuan 00598420',
  nameCn: '田园',
  nameAndId: 'tianyuan 00598420',
  dept: '',
  email: 'tianyuan@example.com',
  createTime: '',
  avatar: '',
  role: '专家',
  hwDepartName5: '某某部门',
  hwDepartName6: '某某 PDU',
};

const EMPTY_USER_INFO: UserInfo = {
  w3Id: '',
  name: '',
  nameCn: '',
  nameAndId: '',
  dept: '',
  email: '',
  createTime: '',
  avatar: '',
  role: '',
  hwDepartName5: '',
  hwDepartName6: '',
};

export const useProfileStore = defineStore('userProfile', () => {

  // 子页面状态
  const loginStatus = reactive({ isEnd: USE_MOCK_USER });

  function updateCheckLoginStatus(val: boolean): void {
    loginStatus.isEnd = val;
  }

  function getCheckLoginStatus(): boolean {
    return loginStatus.isEnd;
  }

  // 用户信息（mock 模式下初始化即为默认用户）
  const userInfo = reactive<UserInfo>(
    USE_MOCK_USER ? { ...DEFAULT_MOCK_USER } : { ...EMPTY_USER_INFO },
  );

  // 子页面状态
  const isSubPage = reactive({ status: false });

  /**
   * 写入 mock 默认用户并完成登录校验
   */
  function applyMockUserInfo(): void {
    updateUserInfo({ ...DEFAULT_MOCK_USER });
    updateAdminUserInfo(DEFAULT_MOCK_USER.role || '专家');
    localStorage.setItem(
      'userPermission',
      JSON.stringify({ isAdmin: false, owner: false } satisfies UserPermission),
    );
    updateCheckLoginStatus(true);
  }

  /**
   * 更新用户信息
   * @param info 用户信息对象
   */
  function updateUserInfo(info: Partial<UserInfo>): void {
    Object.assign(userInfo, {
      ...info,
    });
  }

  /**
   * 更新用户角色信息
   * @param role 用户角色
   */
  function updateAdminUserInfo(role: string): void {
    userInfo.role = role;
  }

  /**
   * 更新子页面状态
   * @param val 状态值
   */
  function updateSubPageStatus(val: boolean): void {
    isSubPage.status = val;
  }

  /** 是否具备专家评审权限 */
  function isExpert(): boolean {
    const role = userInfo.role || '';
    return role === '专家' || /expert/i.test(role);
  }

  /**
   * 初始化用户信息
   */
  async function initUserInfo(): Promise<void> {
    if (USE_MOCK_USER) {
      applyMockUserInfo();
      return;
    }

    try {
      const result = await managerUserService.getUserInfo();
      if (result) {
        const info = {
          w3Id: result.uid,
          name: result.displayNameEN,
          nameCn: result.displayNameCN,
          nameAndId: result.displayNameEN,
          dept: '',
          email: result.mail || '',
          createTime: '',
          avatar: result.uid
            ? `https://w3.huawei.com/w3lab/rest/yellowpage/face/${result.uid.substr(1)}/120`
            : '',
        };
        updateUserInfo(info);
        await getAdminInfo(info.w3Id);
      } else {
        clearUserInfo();
      }
    } catch (error) {
      console.error('Failed to initialize user info:', error);
      clearUserInfo();
    }
  }

  /**
   * 获取管理员信息
   * @param userId 用户ID
   */
  async function getAdminInfo(userId: string): Promise<void> {
    if (USE_MOCK_USER) {
      applyMockUserInfo();
      return;
    }

    const userPermissionObj: UserPermission = {
      isAdmin: false,
      owner: false,
    };

    try {
      if (!userId) {
        updateAdminUserInfo('');
        localStorage.setItem('userPermission', JSON.stringify(userPermissionObj));
        return;
      }

      const res = await managerUserService.getAdminInfo(userId);
      if (res && res.code === 200) {
        const userArr = res.data.filter(
          (item) => item.sAMAccountName === userId || item.id === userId,
        );
        if (userArr.length) {
          const userRole = userArr[0];
          updateAdminUserInfo(userRole.title || '');
          updateUserInfo({
            hwDepartName5: userRole.hwDepartName5 || '',
            hwDepartName6: userRole.hwDepartName6 || '',
          });
          localStorage.setItem('userPermission', JSON.stringify(userPermissionObj));
          updateCheckLoginStatus(true);
          console.log('登录校验结束', loginStatus.isEnd);
          return;
        }
      }

      updateAdminUserInfo('');
      localStorage.setItem('userPermission', JSON.stringify(userPermissionObj));
      updateCheckLoginStatus(true);
      console.log('登录校验结束', loginStatus.isEnd);
    } catch (err) {
      console.error('Failed to fetch admin info:', err);
      updateAdminUserInfo('');
      localStorage.setItem('userPermission', JSON.stringify(userPermissionObj));
      updateCheckLoginStatus(true);
      console.log('登录校验结束', loginStatus.isEnd);
    }
  }

  /**
   * 清除用户信息；live 模式下重定向到登录页
   */
  function clearUserInfo(): void {
    if (USE_MOCK_USER) {
      applyMockUserInfo();
      return;
    }

    updateUserInfo({ ...EMPTY_USER_INFO });
    updateAdminUserInfo('');
    localStorage.setItem('userPermission', JSON.stringify({ isAdmin: false, owner: false }));

    const currHref = document.location.href;
    window.location.href = `https://login.huawei.com/login1/?redirect=${currHref}`;
  }

  const checkUserToken = (): void => {
    if (USE_MOCK_USER) {
      applyMockUserInfo();
      return;
    }

    console.log(new Date(), ' ,start user login check begin........ ');
    managerUserService
      .getUserInfo()
      .then((result) => {
        if (!result) {
          console.log(new Date(), 'failed to get user info');
          clearUserInfo();
        }
      })
      .catch((e) => {
        console.error(e);
        clearUserInfo();
      });
  };

  if (USE_MOCK_USER) {
    localStorage.setItem(
      'userPermission',
      JSON.stringify({ isAdmin: false, owner: false }),
    );
  }

  return {
    userInfo,
    isSubPage,
    loginStatus,
    updateUserInfo,
    updateAdminUserInfo,
    updateSubPageStatus,
    updateCheckLoginStatus,
    getCheckLoginStatus,
    isExpert,
    initUserInfo,
    getAdminInfo,
    checkUserToken,
  };
});
