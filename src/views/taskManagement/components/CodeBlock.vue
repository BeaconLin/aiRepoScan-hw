<template>
  <div class="code-container">
    <div class="code-header">
      <span class="language-label">{{ language }}</span>
      <button
          class="copy-button"
          @click="copyCode"
          :class="{ copied: isCopied }"
      >
        {{ isCopied ? '✓ 已复制' : '复制' }}
      </button>
    </div>
    <pre><code v-html="highlightedCode" :class="'language-' + language"></code></pre>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import hljs from 'highlight.js/lib/core'
import cpp from 'highlight.js/lib/languages/cpp'
import c from 'highlight.js/lib/languages/c'
import java from 'highlight.js/lib/languages/java'
import go from 'highlight.js/lib/languages/go'
import 'highlight.js/styles/atom-one-dark.css'

// 定义 Props 接口
interface Props {
  code: string
  language?: string
}

// ✅ 注册所有已导入的语言
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('c', c)
hljs.registerLanguage('java', java)
hljs.registerLanguage('go', go)

const props = withDefaults(defineProps<Props>(), {
  language: 'cpp'
})

const isCopied = ref<boolean>(false)

// ✅ 计算高亮代码
const highlightedCode = computed<string>(() => {
  // 如果代码为空，直接返回
  if (!props.code || !props.code.trim()) {
    return props.code || ''
  }
  
  // 如果语言未指定，使用默认值
  const lang: string = props.language || 'cpp'
  
  try {
    const result = hljs.highlight(props.code, {
      language: lang,
      ignoreIllegals: true
    })
    return result.value
  } catch (e: unknown) {
    // 如果指定语言高亮失败，尝试使用默认语言 cpp
    if (lang !== 'cpp') {
      try {
        console.warn(`语言 "${lang}" 高亮失败，尝试使用 cpp:`, e)
        const result = hljs.highlight(props.code, {
          language: 'cpp',
          ignoreIllegals: true
        })
        return result.value
      } catch (e2: unknown) {
        console.error('代码高亮失败，返回原始代码:', e2)
        return props.code
      }
    }
    console.error('代码高亮失败，返回原始代码:', e)
    return props.code
  }
})

// ✅ 复制功能
const copyCode = async (): Promise<void> => {
  await navigator.clipboard.writeText(props.code)
  isCopied.value = true
  setTimeout(() => {
    isCopied.value = false
  }, 2000)
}
</script>

<style scoped>
.code-container {
  background-color: #282c34;
  border-radius: 8px;
  overflow-x: auto;
  margin: 16px 0;
}

.code-header {
  background-color: #21252b;
  padding: 10px 16px;
  border-bottom: 1px solid #3e4451;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.language-label {
  color: #abb2bf;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.copy-button {
  background-color: transparent;
  color: #abb2bf;
  border: 1px solid #3e4451;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}

.copy-button:hover {
  background-color: #3e4451;
  color: #61afef;
}

.copy-button.copied {
  background-color: #98c379;
  color: #21252b;
  border-color: #98c379;
}

pre {
  margin: 0;
  padding: 16px;
}

code {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #abb2bf;
}
</style>