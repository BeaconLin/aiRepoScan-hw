<template>
  <div
    v-if="visible"
    ref="rootRef"
    class="scroll-announcement"
    role="status"
    aria-live="polite"
  >
    <div class="announcement-body">
      <span class="announcement-icon" aria-hidden="true">📢</span>
      <span class="announcement-label">系统公告</span>
      <div class="announcement-content">
        <p
          v-for="(message, index) in messages"
          :key="index"
          class="announcement-text"
        >
          {{ message }}
        </p>
      </div>
    </div>
    <button
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
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { SYSTEM_ANNOUNCEMENT } from '@/constants/systemAnnouncement'

const emit = defineEmits<{
  visibleChange: [visible: boolean]
  heightChange: [height: number]
}>()

const props = withDefaults(
  defineProps<{
    messages?: string[]
    enabled?: boolean
    closable?: boolean
  }>(),
  {
    messages: () => SYSTEM_ANNOUNCEMENT.messages,
    enabled: () => SYSTEM_ANNOUNCEMENT.enabled,
    closable: true,
  },
)

const STORAGE_KEY = 'system-announcement-dismissed'

const rootRef = ref<HTMLElement | null>(null)
const dismissed = ref(
  props.closable && sessionStorage.getItem(STORAGE_KEY) === '1',
)

let resizeObserver: ResizeObserver | null = null

const visible = computed(() => {
  return props.enabled && props.messages.length > 0 && !dismissed.value
})

function reportHeight() {
  const height = visible.value && rootRef.value ? rootRef.value.offsetHeight : 0
  emit('heightChange', height)
}

function handleClose() {
  dismissed.value = true
  if (props.closable) {
    sessionStorage.setItem(STORAGE_KEY, '1')
  }
}

watch(visible, async (value) => {
  emit('visibleChange', value)
  await nextTick()
  reportHeight()
}, { immediate: true })

onMounted(() => {
  resizeObserver = new ResizeObserver(() => {
    reportHeight()
  })
  if (rootRef.value) {
    resizeObserver.observe(rootRef.value)
  }
})

watch(rootRef, (element, _, onCleanup) => {
  if (!resizeObserver || !element) {
    return
  }
  resizeObserver.observe(element)
  onCleanup(() => {
    resizeObserver?.unobserve(element)
  })
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})
</script>

<style scoped>
.scroll-announcement {
  position: fixed;
  top: 64px;
  left: 0;
  right: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  box-sizing: border-box;
  padding: 10px 48px;
  background: linear-gradient(90deg, #fff7ed 0%, #ffedd5 50%, #fff7ed 100%);
  border-bottom: 1px solid #fdba74;
  box-shadow: 0 2px 8px rgba(234, 88, 12, 0.12);
}

.announcement-body {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  max-width: 100%;
}

.announcement-icon {
  flex-shrink: 0;
  font-size: 16px;
  line-height: 1;
}

.announcement-label {
  flex-shrink: 0;
  padding: 2px 10px;
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
  color: #9a3412;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  text-align: center;
}

.announcement-text + .announcement-text {
  margin-top: 4px;
}

.close-btn {
  position: absolute;
  top: 50%;
  right: 16px;
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
  color: #9a3412;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.close-btn:hover {
  background: rgba(234, 88, 12, 0.12);
  color: #c2410c;
}
</style>
