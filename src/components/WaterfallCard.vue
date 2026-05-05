<template>
  <div
    class="waterfall-card"
    :class="{ 'is-hovered': isHovered }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @click="handleClick"
  >
    <!-- 图片区域 - 使用动态高度 -->
    <div
      class="card-image-wrapper"
      :style="imageWrapperStyle"
    >
      <img
        ref="imageRef"
        :src="imageUrl"
        :alt="title"
        class="card-image"
        loading="lazy"
        @load="handleImageLoad"
        @error="handleImageError"
      />
      <!-- 图片加载占位 -->
      <div v-if="!imageLoaded" class="image-placeholder">
        <el-icon :size="32" color="#ddd"><Picture /></el-icon>
      </div>
      <!-- 遮罩层 -->
      <div class="image-overlay" v-show="isHovered">
        <div class="overlay-actions">
          <el-button type="primary" circle size="small" @click.stop="handleCollect">
            <el-icon><Collection /></el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="card-content">
      <h3 class="card-title" :title="title">{{ title }}</h3>

      <div class="card-footer">
        <div class="author-info">
          <el-avatar
            :size="24"
            :src="avatar"
            class="author-avatar"
            @click.stop="handleAuthorClick"
          />
          <span class="author-name" @click.stop="handleAuthorClick">{{ author }}</span>
        </div>

        <div class="card-stats">
          <span class="stat-item">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            {{ formatNumber(likes) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Picture, Star, Collection } from '@element-plus/icons-vue'

interface Props {
  id: string | number
  title: string
  imageUrl: string
  imageWidth?: number    // 图片原始宽度
  imageHeight?: number   // 图片原始高度
  avatar: string
  author: string
  likes: number
  authorId?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  imageWidth: 400,
  imageHeight: 300,
  likes: 0
})

const emit = defineEmits<{
  click: [id: string | number]
  like: [id: string | number]
  collect: [id: string | number]
  authorClick: [authorId: string | number]
}>()

// 状态
const isHovered = ref(false)
const imageLoaded = ref(false)
const imageRef = ref<HTMLImageElement>()
const actualImageRatio = ref(0)

// 图片容器高度（根据宽高比计算）
const imageWrapperStyle = computed(() => {
  // 使用实际加载后的比例或传入的比例
  const ratio = actualImageRatio.value || (props.imageHeight / props.imageWidth) || 0.75
  // 最小高度180px，最大高度500px
  const height = Math.max(180, Math.min(500, Math.floor(240 * ratio)))
  return {
    paddingBottom: `${height}px`,
    position: 'relative' as const
  }
})

// 图片加载完成
const handleImageLoad = () => {
  imageLoaded.value = true
  if (imageRef.value) {
    actualImageRatio.value = imageRef.value.naturalHeight / imageRef.value.naturalWidth
  }
}

// 图片加载失败
const handleImageError = () => {
  imageLoaded.value = true
  // 可以设置默认图片
}

// 点击卡片
const handleClick = () => {
  emit('click', props.id)
}

// 点击作者
const handleAuthorClick = () => {
  if (props.authorId) {
    emit('authorClick', props.authorId)
  }
}

// 点赞
const handleLike = () => {
  emit('like', props.id)
}

// 收藏
const handleCollect = () => {
  emit('collect', props.id)
}

// 格式化数字
const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return String(num)
}

// 预加载图片获取真实尺寸
onMounted(() => {
  const img = new Image()
  img.onload = () => {
    actualImageRatio.value = img.naturalHeight / img.naturalWidth
  }
  img.src = props.imageUrl
})
</script>

<style scoped>
.waterfall-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.waterfall-card:hover,
.waterfall-card.is-hovered {
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-4px);
}

/* 图片区域 */
.card-image-wrapper {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
}

.card-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.waterfall-card:hover .card-image {
  transform: scale(1.05);
}

/* 图片占位 */
.image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

/* 遮罩层 */
.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.3) 100%);
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.waterfall-card:hover .image-overlay {
  opacity: 1;
}

.overlay-actions {
  display: flex;
  gap: 8px;
}

/* 内容区域 */
.card-content {
  padding: 12px;
}

.card-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  line-height: 1.5;
  margin: 0 0 10px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}

/* 底部信息 */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.author-avatar {
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.2s;
}

.author-avatar:hover {
  transform: scale(1.1);
}

.author-name {
  font-size: 12px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.author-name:hover {
  color: #ff2442;
}

/* 统计信息 */
.card-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

.stat-item :deep(.el-icon) {
  font-size: 14px;
}
</style>
