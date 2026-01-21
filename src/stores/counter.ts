// 简单的 Pinia store 示例（计数器）
// - 使用组合式 API（setup 语法）创建 store
// - 展示了 reactive state (`ref`)、计算属性 (`computed`) 与 action
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  // 响应式状态：count
  const count = ref(0)

  // 计算属性：基于 count 计算双倍值
  const doubleCount = computed(() => count.value * 2)

  // action：增加计数
  function increment() {
    count.value++
  }

  // 返回对外可用的 state 和方法
  return { count, doubleCount, increment }
})
