<script setup lang="ts">
// Home 视图：展示笔记网格（示例数据）
// - 使用 Composition API 的 `ref` 持有本地示例数据
// - 图标来自 Element Plus 的图标库
import { ref, onMounted } from 'vue'
import { Star, ChatDotRound, Share } from '@element-plus/icons-vue'
import { NoteAPI } from '../utils/api'

interface Note {
  id: string | number
  title: string
  image: string
  avatar: string
  author: string
  likes: number
  comments: number
  saves: number
}

// `notes` 将通过接口分页获取：/api/note/list/page
const notes = ref<Note[]>([])

// 分页控制（可用于上拉/下拉或分页组件）
const current = ref(1)
const pageSize = ref(12)
const total = ref(0)
const loading = ref(false)
const errorMsg = ref('')

// 将后端记录映射为视图所需字段的辅助函数
const mapRecordToNote = (r: Record<string, unknown>): Note => {
  const record = r as Record<string, unknown> & {
    title?: string
    content?: string
    coverUrl?: string
    imageUrls?: string[]
    userVO?: { avatar?: string; nickname?: string; account?: string }
    likes?: number
    likeCount?: number
    comments?: number
    commentCount?: number
    saves?: number
    collectCount?: number
  }
  return {
    id: (record.id as string | number) || '',
    title: (record.title as string) || (record.content as string) || '',
    // 优先使用 coverUrl，其次使用第一张 imageUrls
    image:
      (record.coverUrl as string) ||
      (Array.isArray(record.imageUrls) && record.imageUrls[0]) ||
      'https://via.placeholder.com/280x360?text=No+Image',
    avatar: (record.userVO?.avatar as string) || 'https://via.placeholder.com/32',
    author: (record.userVO?.nickname as string) || (record.userVO?.account as string) || '匿名',
    likes: (record.likes ?? record.likeCount ?? 0) as number,
    comments: (record.comments ?? record.commentCount ?? 0) as number,
    saves: (record.saves ?? record.collectCount ?? 0) as number,
  }
}

// 从后端拉取分页数据，使用 API 类
const fetchNotes = async (page = 1, size = 12) => {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await NoteAPI.getList(page, size)
    const recs = (res?.data?.records as Array<Record<string, unknown>>) || []
    total.value = (res?.data?.total as number) ?? 0
    notes.value = recs.map(mapRecordToNote)
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '请求失败'
    notes.value = []
  } finally {
    loading.value = false
  }
}

// 初次加载
onMounted(() => {
  fetchNotes(current.value, pageSize.value)
})

// 格式化数字的简单工具函数：示例将 >=1 的数字显示为一位小数并加上 '万'
// 说明：这里是示例逻辑，生产环境应根据数据真实含义（是否单位为万）调整
const formatNumber = (num: number): string => {
  // 如果是比万更大的数字，转为带一位小数的“万”单位
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return String(num)
}
</script>

<template>
  <!--
    笔记网格：使用 CSS Grid 自动填充列
    - `minmax(280px, 1fr)` 确保每个卡片最小宽度 280px，窗口变宽后自动增加列数
  -->
  <div class="home-view">
    <div v-if="loading" class="notes-loading">加载中...</div>
    <div v-else-if="errorMsg" class="notes-error">加载失败：{{ errorMsg }}</div>
    <div v-else class="notes-grid">
      <div v-for="note in notes" :key="note.id" class="note-card">
        <!-- 图片区域 -->
        <div class="note-image">
          <img :src="note.image" :alt="note.title" />
        </div>

        <!-- 文字与底部信息 -->
        <div class="note-content">
          <h3 class="note-title">{{ note.title }}</h3>
          <div class="note-footer">
            <div class="author-info">
              <img :src="note.avatar" :alt="note.author" class="avatar" />
              <span class="author-name">{{ note.author }}</span>
            </div>

            <!-- 操作区：点赞 / 评论 / 分享 -->
            <div class="actions">
              <div class="action-item">
                <el-icon><Star /></el-icon>
                <span>{{ formatNumber(note.likes) }}</span>
              </div>
              <div class="action-item">
                <el-icon><ChatDotRound /></el-icon>
                <span>{{ note.comments }}</span>
              </div>
              <div class="action-item">
                <el-icon><Share /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-view {
  width: 100%;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  width: 100%;
}

.note-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.note-card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.note-image {
  width: 100%;
  height: 360px;
  overflow: hidden;
  background: #f0f0f0;
}

.note-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.note-card:hover .note-image img {
  transform: scale(1.05);
}

.note-content {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.note-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  line-height: 1.4;
  /* 多行文本截断：限制为两行并溢出隐藏 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
}

.note-footer {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.author-name {
  font-size: 12px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.actions {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.3s;
}

.action-item:hover {
  color: #ff3c5a;
}

.action-item :deep(.el-icon) {
  font-size: 14px;
}
</style>
