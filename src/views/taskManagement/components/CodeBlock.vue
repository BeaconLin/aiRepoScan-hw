<template>
  <div class="code-container">
    <div class="code-header">
      <span class="language-label">{{ language }}</span>
      <button
          type="button"
          class="copy-button"
          @click="copyCode"
          :class="{ copied: isCopied }"
      >
        {{ isCopied ? '✓ 已复制' : '复制' }}
      </button>
    </div>
    <pre class="code-pre"><code v-html="highlightedCode" :class="'hljs language-' + language"></code></pre>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import hljs from 'highlight.js/lib/core'
import type { LanguageFn } from 'highlight.js'
import cpp from 'highlight.js/lib/languages/cpp'
import c from 'highlight.js/lib/languages/c'
import java from 'highlight.js/lib/languages/java'
import go from 'highlight.js/lib/languages/go'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import rust from 'highlight.js/lib/languages/rust'
import php from 'highlight.js/lib/languages/php'
import ruby from 'highlight.js/lib/languages/ruby'
import csharp from 'highlight.js/lib/languages/csharp'
import 'highlight.js/styles/github.css'
import { copyText } from '@/utils/utils'
import { ElMessage } from "element-plus";
interface Props {
  code: string
  language?: string
}

/** 语言模块推断类型与 highlight.js 的 Language/LanguageFn 声明在 keywords 等处不完全一致，运行时安全 */
const lang = (m: unknown): LanguageFn => m as LanguageFn

hljs.registerLanguage('cpp', lang(cpp))
hljs.registerLanguage('c', lang(c))
hljs.registerLanguage('java', lang(java))
hljs.registerLanguage('go', lang(go))
hljs.registerLanguage('javascript', lang(javascript))
hljs.registerLanguage('typescript', lang(typescript))
hljs.registerLanguage('python', lang(python))
hljs.registerLanguage('rust', lang(rust))
hljs.registerLanguage('php', lang(php))
hljs.registerLanguage('ruby', lang(ruby))
hljs.registerLanguage('csharp', lang(csharp))

const props = withDefaults(defineProps<Props>(), {
  language: 'cpp',
})

const isCopied = ref<boolean>(false)

const highlightedCode = computed<string>(() => {
  if (!props.code || !props.code.trim()) {
    return props.code || ''
  }

  const lang: string = props.language || 'cpp'

  try {
    const result = hljs.highlight(props.code, {
      language: lang,
      ignoreIllegals: true,
    })
    return result.value
  } catch (e: unknown) {
    if (lang !== 'cpp') {
      try {
        console.warn(`语言 "${lang}" 高亮失败，尝试使用 cpp:`, e)
        const result = hljs.highlight(props.code, {
          language: 'cpp',
          ignoreIllegals: true,
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

const copyCode = async (): Promise<void> => {
  copyText(props.code)
  ElMessage.success(`复制成功`)
}
</script>

<style scoped>
.code-container {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  margin: 0;
  background-color: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  overflow: hidden;
}

.code-header {
  background-color: #eef1f5;
  padding: 8px 12px;
  border-bottom: 1px solid #e1e4e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.language-label {
  color: #57606a;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.copy-button {
  background-color: #ffffff;
  color: #24292f;
  border: 1px solid #d0d7de;
  padding: 4px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.copy-button:hover {
  background-color: #f3f4f6;
  border-color: #8c959f;
}

.copy-button.copied {
  background-color: #dcfce7;
  color: #166534;
  border-color: #86efac;
}

.code-pre {
  margin: 0;
  padding: 12px 14px;
  overflow-x: auto;
  max-width: 100%;
  box-sizing: border-box;
}

.code-pre code {
  font-family: ui-monospace, 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  line-height: 1.55;
  display: block;
  max-width: 100%;
  word-break: break-word;
  white-space: pre-wrap;
}
</style>