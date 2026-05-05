<template>
  <div class="home-view">
    <!-- 加载中状态 -->
    <div v-if="loading && notes.length === 0" class="initial-loading">
      <el-skeleton :rows="10" animated />
    </div>

    <!-- 错误提示 -->
    <div v-else-if="errorMsg" class="error-state">
      <el-empty description="加载失败" :image-size="120">
        <template #description>
          <p>{{ errorMsg }}</p>
        </template>
        <el-button type="primary" @click="refresh">重新加载</el-button>
      </el-empty>
    </div>

    <!-- 空状态 -->
    <div v-else-if="notes.length === 0" class="empty-state">
      <el-empty description="暂无笔记" :image-size="120" />
    </div>

    <!-- 瀑布流内容 -->
    <template v-else>
      <WaterfallContainer
        :items="notesWithHeight"
        :loading="loading"
        :no-more="noMore"
        :gap="16"
        :min-column-width="220"
        @load-more="loadMore"
      >
        <template #default="{ item }">
          <WaterfallCard
            :id="item.id"
            :title="item.title"
            :image-url="item.image"
            :image-width="item.imageWidth"
            :image-height="item.imageHeight"
            :avatar="item.avatar"
            :author="item.author"
            :likes="item.likes"
            :author-id="item.userId"
            @click="openDetail"
            @like="handleLike"
            @collect="handleCollect"
            @author-click="goToUserProfile"
          />
        </template>
      </WaterfallContainer>
    </template>

    <!-- 笔记详情弹窗 -->
    <NoteDetailModal
      v-model:visible="detailVisible"
      :note-id="currentNoteId"
      @update="handleNoteUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { NoteAPI, LikeAPI, FavoriteAPI } from '../utils/api'
import WaterfallContainer from '@/components/WaterfallContainer.vue'
import WaterfallCard from '@/components/WaterfallCard.vue'
import NoteDetailModal from '@/components/NoteDetailModal.vue'

const router = useRouter()

// 笔记数据类型
interface Note {
  id: string | number
  userId: string | number
  title: string
  image: string
  imageWidth: number
  imageHeight: number
  avatar: string
  author: string
  likes: number
  comments: number
  saves: number
  estimatedHeight: number
}

// 原始笔记数据
const notes = ref<Note[]>([])

// 添加预估高度的笔记数据（用于瀑布流计算）
const notesWithHeight = computed(() => {
  return notes.value.map(note => ({
    ...note,
    estimatedHeight: calculateEstimatedHeight(note)
  }))
})

// 计算预估高度（根据图片比例 + 文字区域固定高度）
const calculateEstimatedHeight = (note: Note): number => {
  const containerWidth = 240 // 预估列宽
  const imageRatio = note.imageHeight / note.imageWidth || 0.75
  const imageHeight = Math.max(180, Math.min(400, containerWidth * imageRatio))
  const contentHeight = 100 // 标题 + 作者区域大约高度
  return imageHeight + contentHeight
}

// 弹窗控制
const detailVisible = ref(false)
const currentNoteId = ref<string | number>('')

// 分页控制
const current = ref(1)
const pageSize = ref(20)
const total = ref(0)
const loading = ref(false)
const errorMsg = ref('')
const noMore = computed(() => notes.value.length >= total.value && total.value > 0)

// 打开详情
const openDetail = (id: string | number) => {
  currentNoteId.value = id
  detailVisible.value = true
}

// 跳转到用户主页
const goToUserProfile = (userId: string | number) => {
  router.push(`/user/${userId}`)
}

// 点赞
const handleLike = async (id: string | number) => {
  try {
    const res = await LikeAPI.like(id)
    // 使用后端返回的最新状态更新前端 UI
    const newIsLiked = res.data as boolean
    const note = notes.value.find(n => n.id === id)
    if (note) {
      // 根据新状态更新数量
      note.likes = newIsLiked
        ? (note.likes || 0) + 1
        : Math.max((note.likes || 0) - 1, 0)
      ElMessage.success(newIsLiked ? '点赞成功' : '已取消点赞')
    }
  } catch (error) {
    ElMessage.error('操作失败，请重试')
  }
}

// 收藏
const handleCollect = async (id: string | number) => {
  try {
    const res = await FavoriteAPI.favorite(id)
    // 使用后端返回的最新状态更新前端 UI
    const newIsCollected = res.data as boolean
    const note = notes.value.find(n => n.id === id)
    if (note) {
      // 根据新状态更新数量
      note.saves = newIsCollected
        ? (note.saves || 0) + 1
        : Math.max((note.saves || 0) - 1, 0)
      ElMessage.success(newIsCollected ? '收藏成功' : '已取消收藏')
    }
  } catch (error) {
    ElMessage.error('操作失败，请重试')
  }
}

// 处理笔记详情弹窗关闭后的状态更新
const handleNoteUpdate = (data: {
  noteId: string | number
  likes: number
  favs: number
  isLiked: boolean
  isCollected: boolean
}) => {
  const note = notes.value.find(n => n.id === data.noteId)
  if (note) {
    note.likes = data.likes
    note.saves = data.favs
  }
}

// 将后端记录映射为视图所需字段
const mapRecordToNote = (r: Record<string, unknown>): Note => {
  const record = r as Record<string, unknown> & {
    title?: string
    content?: string
    coverUrl?: string
    coverWidth?: number
    coverHeight?: number
    imageUrls?: string[]
    userVO?: { id?: string | number; avatar?: string; nickname?: string; account?: string }
    likes?: number
    likeCount?: number
    comments?: number
    commentCount?: number
    saves?: number
    collectCount?: number
  }

  // 获取封面图URL
  const coverUrl = record.coverUrl as string

  // 尝试从URL解析图片尺寸（如果没有返回的话）
  let imageWidth = record.coverWidth || 400
  let imageHeight = record.coverHeight || 300

  // 如果没有尺寸信息，尝试从unsplash URL解析
  if (!imageWidth && coverUrl && coverUrl.includes('unsplash.com')) {
    // Unsplash图片默认比例约为 4:3 或 3:4
    imageWidth = 400
    imageHeight = Math.random() > 0.5 ? 300 : 500 // 模拟不同比例
  }

  return {
    id: (record.id as string | number) || '',
    userId: (record.userVO?.id as string | number) || '',
    title: (record.title as string) || (record.content as string)?.slice(0, 50) || '',
    image: coverUrl,
    imageWidth,
    imageHeight,
    avatar: (record.userVO?.avatar as string) || 'https://via.placeholder.com/32',
    author: (record.userVO?.nickname as string) || (record.userVO?.account as string) || '匿名',
    likes: (record.likes as number) || 0,
    comments: (record.comments as number) || 0,
    saves: (record.favs as number) || 0,
    estimatedHeight: 0 // 会在 computed 中计算
  }
}

// 获取笔记列表
const fetchNotes = async (page = 1, size = 20) => {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await NoteAPI.getList(page, size)
    const recs = (res?.data?.records as Array<Record<string, unknown>>) || []
    total.value = (res?.data?.total as number) ?? 0

    const newNotes = recs.map(mapRecordToNote)

    if (page === 1) {
      notes.value = newNotes
    } else {
      notes.value.push(...newNotes)
    }
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '请求失败'
    if (page === 1) {
      notes.value = []
    }
  } finally {
    loading.value = false
  }
}

// 加载更多
const loadMore = () => {
  if (loading.value || noMore.value) return
  current.value++
  fetchNotes(current.value, pageSize.value)
}

// 刷新
const refresh = () => {
  current.value = 1
  notes.value = []
  fetchNotes(1, pageSize.value)
}

// 初次加载
onMounted(() => {
  fetchNotes(1, pageSize.value)
})
</script>

<style scoped>
.home-view {
  width: 100%;
  min-height: 100vh;
  padding: 16px 0;
}

/* 初始加载状态 */
.initial-loading {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* 错误状态 */
.error-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 40px;
}

/* 空状态 */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}
</style>
