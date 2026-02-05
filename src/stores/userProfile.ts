import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 用户信息类型定义
 * @typedef {Object} UserInfo
 * @property {string} w3Id - 用户短工号，用用户姓名首字母加上8位数字作为工号，并且前两位是00，例如：姓名张三，工号z00660606
 * @property {string} name - 用户长工号，用户姓名拼音拼接纯数字工号，例如：zhangsan 00660606
 * @property {string} nameCn - 中文姓名，如：张三
 */

// 默认用户信息（固定值，用于演示）
const DEFAULT_USER_INFO = {
    w3Id: 't00598420',
    name: 'tianyuan 00598420',
    nameCn: '田园'
}

export const userProfileStore = defineStore('userProfile', () => {
    // 当前用户信息（使用固定默认值）
    const userInfo = ref({ ...DEFAULT_USER_INFO })

    /**
     * 设置用户信息
     * @param {UserInfo} newUserInfo - 新的用户信息对象
     */
    const setUserInfo = (newUserInfo) => {
        if (newUserInfo && typeof newUserInfo === 'object') {
            userInfo.value = {
                w3Id: newUserInfo.w3Id || '',
                name: newUserInfo.name || '',
                nameCn: newUserInfo.nameCn || ''
            }
            return true
        }
        return false
    }

    /**
     * 更新用户信息（部分更新）
     * @param {Partial<UserInfo>} updates - 要更新的用户信息字段
     */
    const updateUserInfo = (updates) => {
        if (userInfo.value && updates && typeof updates === 'object') {
            userInfo.value = {
                ...userInfo.value,
                ...updates
            }
            return true
        }
        return false
    }

    /**
     * 清除用户信息（重置为默认值）
     */
    const clearUserInfo = () => {
        userInfo.value = { ...DEFAULT_USER_INFO }
    }

    /**
     * 获取用户信息
     * @returns {UserInfo}
     */
    const getUserInfo = () => {
        return userInfo.value
    }

    /**
     * 检查用户是否已登录
     * @returns {boolean}
     */
    const isLoggedIn = () => {
        return userInfo.value && userInfo.value.w3Id !== ''
    }

    return {
        userInfo,
        setUserInfo,
        updateUserInfo,
        clearUserInfo,
        getUserInfo,
        isLoggedIn
    }
})
