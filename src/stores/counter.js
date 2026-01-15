import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(1)
  const title = ref('Vue + Pinia + Element Plus')

  const increment = () => {
    count.value += 1
  }

  const reset = () => {
    count.value = 1
  }

  return {
    title,
    count,
    increment,
    reset,
  }
})

