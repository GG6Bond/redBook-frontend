<template>
  <div ref="containerRef" class="waterfall-container">
    <!-- 瀑布流列容器 -->
    <div
      v-for="(column, colIndex) in columns"
      :key="colIndex"
      class="waterfall-column"
      :style="{ width: `${columnWidth}px` }"
    >
      <TransitionGroup name="card-fade">
        <div
          v-for="item in column"
          :key="item.id"
          class="card-wrapper"
        >
          <slot :item="item" :column-index="colIndex" />
        </div>
      </TransitionGroup>
    </div>

    <!-- 加载更多触发器 -->
    <div ref="loadMoreRef" class="load-more-trigger">
      <div v-if="loading" class="loading-state">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
      <div v-else-if="noMore" class="no-more-state">
        <span>没有更多了</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Loading } from '@element-plus/icons-vue'

interface Props {
  items: any[]           // 数据列表
  columnCount?: number   // 列数（响应式时会覆盖）
  gap?: number           // 卡片间距
  minColumnWidth?: number // 最小列宽
  loading?: boolean      // 加载中状态
  noMore?: boolean       // 没有更多数据
}

const props = withDefaults(defineProps<Props>(), {
  columnCount: 0,        // 0表示自动计算
  gap: 16,
  minColumnWidth: 240,
  loading: false,
  noMore: false
})

const emit = defineEmits<{
  loadMore: []           // 触发加载更多
}>()

// 响应式列数计算
const getResponsiveColumnCount = (width: number): number => {
  if (width >= 1600) return 6
  if (width >= 1400) return 5
  if (width >= 1080) return 4
  if (width >= 768) return 3
  if (width >= 480) return 2
  return 2
}

// DOM引用
const containerRef = ref<HTMLElement>()
const loadMoreRef = ref<HTMLElement>()

// 实际列数
const actualColumnCount = computed(() => {
  if (props.columnCount > 0) return props.columnCount
  if (!containerRef.value) return 4
  return getResponsiveColumnCount(containerRef.value.clientWidth)
})

// 列宽计算
const columnWidth = computed(() => {
  if (!containerRef.value) return props.minColumnWidth
  const containerWidth = containerRef.value.clientWidth
  const totalGap = (actualColumnCount.value - 1) * props.gap
  return Math.floor((containerWidth - totalGap) / actualColumnCount.value)
})

// 瀑布流列数据（按高度分配）
const columns = computed(() => {
  const cols: any[][] = Array.from({ length: actualColumnCount.value }, () => [])
  const colHeights = new Array(actualColumnCount.value).fill(0)

  // 记录每个item的高度（从item的estimatedHeight获取或使用默认值）
  for (const item of props.items) {
    // 找到当前高度最小的列
    const minHeightIndex = colHeights.indexOf(Math.min(...colHeights))
    cols[minHeightIndex].push(item)
    
    // 累加高度（使用预估高度）
    const itemHeight = item.estimatedHeight || 400
    colHeights[minHeightIndex] += itemHeight + props.gap
  }

  return cols
})

// Intersection Observer 用于无限滚动
let observer: IntersectionObserver | null = null

const setupIntersectionObserver = () => {
  if (!loadMoreRef.value) return

  observer = new IntersectionObserver(
    (entries) => {
      const target = entries[0]
      if (target.isIntersecting && !props.loading && !props.noMore) {
        emit('loadMore')
      }
    },
    {
      root: null,
      rootMargin: '100px', // 提前100px触发加载
      threshold: 0
    }
  )

  observer.observe(loadMoreRef.value)
}

// 窗口大小变化处理
let resizeTimer: number | null = null
const handleResize = () => {
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = window.setTimeout(() => {
    // 列数变化时会自动重新计算
  }, 200)
}

onMounted(() => {
  setupIntersectionObserver()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (observer) observer.disconnect()
  window.removeEventListener('resize', handleResize)
  if (resizeTimer) clearTimeout(resizeTimer)
})

// 暴露方法供父组件调用
defineExpose({
  // 滚动到顶部
  scrollToTop: () => {
    containerRef.value?.scrollIntoView({ behavior: 'smooth' })
  }
})
</script>

<style scoped>
.waterfall-container {
  display: flex;
  justify-content: center;
  gap: v-bind('`${gap}px`');
  width: 100%;
  min-height: 100vh;
  padding: 0 8px;
}

.waterfall-column {
  display: flex;
  flex-direction: column;
  gap: v-bind('`${gap}px`');
}

.card-wrapper {
  width: 100%;
  break-inside: avoid;
}

/* 卡片入场动画 */
.card-fade-enter-active,
.card-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-fade-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.card-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* 加载更多区域 */
.load-more-trigger {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-state,
.no-more-state {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #999;
  font-size: 14px;
}

.loading-icon {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
