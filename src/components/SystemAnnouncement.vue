<template>
  <div
    v-if="visible"
    class="system-announcement"
    role="status"
    aria-live="polite"
  >
    <div class="announcement-inner">
      <span class="announcement-icon" aria-hidden="true">📢</span>
      <span class="announcement-label">系统公告</span>
      <div class="announcement-content">
        <p
          v-for="(message, index) in displayMessages"
          :key="index"
          class="announcement-text"
        >
          {{ message }}
        </p>
      </div>
    </div>
    <button
      v-if="closable"
      type="button"
      class="close-btn"
      aria-label="关闭公告"
      @click="handleClose"
    >
      ×
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  SYSTEM_ANNOUNCEMENT,
  SYSTEM_ANNOUNCEMENT_DISMISS_KEY,
} from '../constants/systemAnnouncement'

const props = withDefaults(
  defineProps<{
    messages?: string[]
    enabled?: boolean
    closable?: boolean
  }>(),
  {
    closable: true,
  },
)

const displayMessages = computed(
  () => props.messages ?? SYSTEM_ANNOUNCEMENT.messages,
)
const isEnabled = computed(
  () => props.enabled ?? SYSTEM_ANNOUNCEMENT.enabled,
)

function readDismissedFromStorage(): boolean {
  if (!props.closable) {
    return false
  }
  try {
    return sessionStorage.getItem(SYSTEM_ANNOUNCEMENT_DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

const dismissed = ref(readDismissedFromStorage())

const visible = computed(() => {
  return isEnabled.value && displayMessages.value.length > 0 && !dismissed.value
})

function handleClose() {
  dismissed.value = true
  if (props.closable) {
    try {
      sessionStorage.setItem(SYSTEM_ANNOUNCEMENT_DISMISS_KEY, '1')
    } catch {
      // 忽略存储失败
    }
  }
}
</script>

<style scoped>
.system-announcement {
  position: relative;
  grid-column: 2;
  justify-self: center;
  width: max-content;
  max-width: min(720px, 50vw);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 32px;
}

.announcement-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  max-width: 100%;
}

.announcement-icon {
  flex-shrink: 0;
  font-size: 15px;
  line-height: 1;
}

.announcement-label {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 4px;
  background: #ea580c;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.announcement-content {
  min-width: 0;
  text-align: center;
}

.announcement-text {
  margin: 0;
  color: #fde68a;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  text-align: center;
  word-break: break-word;
}

.announcement-text + .announcement-text {
  margin-top: 2px;
}

.close-btn {
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #d1d5db;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}
</style>
