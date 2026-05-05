<template>
  <el-dialog
    v-model="visible"
    width="900px"
    class="note-detail-modal"
    :show-close="false"
    append-to-body
    align-center
    destroy-on-close
    @close="handleClose"
  >
    <div class="modal-content" v-loading="loading">
      <div class="media-container">
        <el-carousel
          v-if="noteData.imageUrls && noteData.imageUrls.length > 0"
          trigger="click"
          height="100%"
          :autoplay="true"
          :loop="false"
          indicator-position="outside"
          :motion-blur="true"
          :interval="2000"
          :pause-on-hover="true"
        >
          <el-carousel-item v-for="(img, index) in noteData.imageUrls" :key="index">
            <div class="image-wrapper">
              <img :src="img" alt="笔记图片" class="carousel-image" />
            </div>
          </el-carousel-item>
        </el-carousel>
        <div v-else class="empty-image">
          <el-icon :size="40" color="#ddd"><Picture /></el-icon>
        </div>
      </div>

      <div class="info-container">
        <div class="author-header">
          <div class="author-left">
            <el-avatar :size="40" :src="noteData.userVO?.avatar || defaultAvatar" />
            <span class="nickname">{{ noteData.userVO?.nickname || '未知用户' }}</span>
          </div>

          <el-button
            v-if="showFollowButton"
            :type="isFollowed ? 'info' : 'danger'"
            :plain="isFollowed"
            :loading="followLoading"
            round
            size="small"
            @click.stop="handleFollowToggle"
          >
            {{ isFollowed ? '已关注' : '关注' }}
          </el-button>
        </div>

        <div class="scroll-content">
          <h1 class="note-title">{{ noteData.title }}</h1>
          <div class="note-text">{{ noteData.content }}</div>

          <div class="date-location">
            <span>{{ formatDate(noteData.createTime) }}</span>
            <span v-if="noteData.userVO?.region" class="location">{{
              noteData.userVO.region
            }}</span>
          </div>

          <el-divider />

          <!-- 评论区 -->
          <CommentsSection ref="commentsSectionRef" :noteId="noteId" @comment-change="handleCommentChange" />
        </div>

        <div class="interaction-footer">
          <div class="input-wrapper">
            <el-input v-model="commentText" placeholder="说点什么..." class="comment-input">
              <template #suffix>
                <el-button type="primary" link @click="handleSendComment">发送</el-button>
              </template>
            </el-input>
          </div>
          <div class="icons-wrapper">
            <div class="icon-item" :class="{ 'is-active': noteData.isLiked }" @click="handleLike">
              <svg viewBox="0 0 24 24" width="24" height="24" :fill="noteData.isLiked ? '#ff2442' : 'none'" :stroke="noteData.isLiked ? '#ff2442' : 'currentColor'" stroke-width="2">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span class="count">{{ noteData.likes || 0 }}</span>
            </div>
            <div class="icon-item" :class="{ 'is-active': noteData.isCollected }" @click="handleCollect">
              <el-icon :size="24" :color="noteData.isCollected ? '#ffcc00' : ''">
                <CollectionTag />
              </el-icon>
              <span class="count">{{ noteData.favs || 0 }}</span>
            </div>
            <div class="icon-item" @click="handleShare">
              <el-icon :size="24"><Share /></el-icon>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Picture, Star, CollectionTag, Share } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import { FollowAPI, NoteAPI, UserAPI, LikeAPI, FavoriteAPI } from '@/utils/api.ts'
import CommentsSection from '@/components/CommentsSection.vue'

const props = defineProps<{
  visible: boolean
  noteId: string
}>()

const emit = defineEmits(['update:visible', 'update'])

const visible = ref(false)
const loading = ref(false)
const commentText = ref('')
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

// 评论组件引用
const commentsSectionRef = ref<any>(null)

// 定义数据结构
const noteData = ref<any>({
  imageUrls: [], // 确保轮播图一开始是个空数组，而不是 undefined
  userVO: {},
  title: '',
  content: '',
  likes: 0,
  favs: 0,
  comments: 0,
  isLiked: false,    // 是否已点赞
  isCollected: false, // 是否已收藏
})

// 监听 props 变化
watch(
  () => props.visible,
  async (val) => {
    visible.value = val
    if (val && props.noteId) {
      // 先获取当前用户ID，再获取笔记详情
      await fetchCurrentUserId()
      await fetchNoteDetail(props.noteId)
    }
  },
)

watch(visible, (val) => {
  emit('update:visible', val)
})

const handleClose = () => {
  // 关闭时通知父组件更新列表中的状态
  emit('update', {
    noteId: props.noteId,
    likes: noteData.value.likes,
    favs: noteData.value.favs,
    isLiked: noteData.value.isLiked,
    isCollected: noteData.value.isCollected
  })
  visible.value = false
}

// 定义一个响应式的关注状态
const isFollowed = ref(false)
const followLoading = ref(false)
const likeLoading = ref(false)
const collectLoading = ref(false)

// 当前登录用户ID
const currentUserId = ref('')

// 获取当前登录用户ID（总是从API获取最新值，避免精度丢失）
const fetchCurrentUserId = async () => {
  try {
    const res = await UserAPI.getCurrentUser()
    if (res.code === 0 && res.data?.id) {
      currentUserId.value = String(res.data.id)
      // 缓存到 localStorage
      localStorage.setItem('userId', String(res.data.id))
    }
  } catch (error) {
    console.error('获取当前用户信息失败:', error)
    // 失败时回退到 localStorage
    const storedUserId = localStorage.getItem('userId')
    if (storedUserId) {
      currentUserId.value = storedUserId
    }
  }
}

// 判断是否显示关注按钮（不是自己的笔记才显示）
const showFollowButton = computed(() => {
  const authorId = noteData.value?.userVO?.id
  const currentId = currentUserId.value
  console.log('调试 - 作者ID:', authorId, '当前用户ID:', currentId)
  console.log('调试 - 比较结果:', String(authorId) !== String(currentId))
  return authorId && String(authorId) !== String(currentId)
})



/**
 * 处理关注/取关点击事件
 */
const handleFollowToggle = async () => {
  const userId = noteData.value?.userVO?.id
  if (!userId) {
    ElMessage.warning('用户信息不存在')
    return
  }

  followLoading.value = true
  try {
    const res = await FollowAPI.follow(userId)
    if (res.code === 0) {
      // 接口返回 data: { followed: boolean, mutual: boolean }
      // 直接根据后端返回的最新状态更新前端 UI
      isFollowed.value = res.data.followed

      ElMessage.success(isFollowed.value ? '关注成功' : '已取消关注')
    }
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败，请重试')
  } finally {
    followLoading.value = false
  }
}

// 获取笔记详情
const fetchNoteDetail = async (id: string) => {
  loading.value = true
  try {
    // 1. 发起真实请求
    const res = await NoteAPI.getDetail(id)

    // 2. 判断业务状态码 (假设 code === 0 为成功)
    if (res.code === 0 && res.data) {
      // 3. 赋值给响应式数据
      // 注意：后端接口可能缺 likes, favs, comments 字段，这里手动补 0 防止页面显示异常
      noteData.value = {
        ...res.data,
        likes: (res.data as any).likes || 0,
        favs: (res.data as any).favs || 0,
        comments: (res.data as any).comments || 0,
        // 从后端获取点赞和收藏状态
        isLiked: (res.data as any).isLiked || false,
        isCollected: (res.data as any).isCollected || false,
        // 确保 userVO 存在，防止报错
        userVO: res.data.userVO || {},
      }

      // 设置关注状态
      isFollowed.value = res.data.userVO?.followed || false
    } else {
      ElMessage.error(res.message || '获取笔记详情失败')
    }
  } catch (error) {
    console.error('请求详情出错:', error)
    ElMessage.error('网络异常，请稍后重试')
  } finally {
    loading.value = false
  }
}

const formatDate = (time: string) => {
  if (!time) return ''
  return dayjs(time).format('MM-DD HH:mm')
}

// 发送评论
const handleSendComment = () => {
  if (!commentText.value) return
  if (commentsSectionRef.value) {
    commentsSectionRef.value.sendComment(commentText.value)
    commentText.value = ''
  }
}

// 处理评论变化（更新评论数等）
const handleCommentChange = () => {
  // 可以在这里更新笔记的评论数量
  console.log('评论发生变化')
}

/**
 * 处理点赞/取消点赞
 */
const handleLike = async () => {
  if (likeLoading.value) return
  if (!props.noteId) {
    ElMessage.warning('笔记信息不存在')
    return
  }

  likeLoading.value = true
  try {
    // 后端接口是切换式的：已点赞则取消，未点赞则点赞
    const res = await LikeAPI.like(props.noteId)

    if (res.code === 0) {
      // 使用后端返回的最新状态更新前端 UI
      const newIsLiked = res.data as boolean
      const oldIsLiked = noteData.value.isLiked

      noteData.value.isLiked = newIsLiked
      // 根据新状态更新数量
      noteData.value.likes = newIsLiked
        ? (noteData.value.likes || 0) + 1
        : Math.max((noteData.value.likes || 0) - 1, 0)

      ElMessage.success(newIsLiked ? '点赞成功' : '已取消点赞')
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (error) {
    console.error('点赞失败:', error)
    ElMessage.error('操作失败，请重试')
  } finally {
    likeLoading.value = false
  }
}

/**
 * 处理收藏/取消收藏
 */
const handleCollect = async () => {
  if (collectLoading.value) return
  if (!props.noteId) {
    ElMessage.warning('笔记信息不存在')
    return
  }

  collectLoading.value = true
  try {
    // 后端接口是切换式的：已收藏则取消，未收藏则收藏
    const res = await FavoriteAPI.favorite(props.noteId)

    if (res.code === 0) {
      // 使用后端返回的最新状态更新前端 UI
      const newIsCollected = res.data as boolean
      const oldIsCollected = noteData.value.isCollected

      noteData.value.isCollected = newIsCollected
      // 根据新状态更新数量
      noteData.value.favs = newIsCollected
        ? (noteData.value.favs || 0) + 1
        : Math.max((noteData.value.favs || 0) - 1, 0)

      ElMessage.success(newIsCollected ? '收藏成功' : '已取消收藏')
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (error) {
    console.error('收藏失败:', error)
    ElMessage.error('操作失败，请重试')
  } finally {
    collectLoading.value = false
  }
}

/**
 * 处理分享
 */
const handleShare = () => {
  ElMessage.info('分享功能暂未开放')
}
</script>

<style scoped>
/* 核心布局 */
.modal-content {
  display: flex;
  height: 80vh; /* 弹窗高度固定，为了内部滚动 */
  background: #fff;
  border-radius: 4px;
  overflow: hidden;
}

.image-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
}

.carousel-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain; /* 保证图片完整显示不裁剪 */
}

/* 右侧：信息区 */
.info-container {
  width: 35%;
  display: flex;
  flex-direction: column;
  position: relative;
  //border-left: 1px solid #f0f0f0;
}

/* 1. 作者头部 */
.author-header {
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f6f6f6;
}

.author-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nickname {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

/* 2. 中间滚动区 */
.scroll-content {
  flex: 1;
  overflow-y: auto; /* 允许垂直滚动 */
  padding: 20px;
}

.note-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 10px;
  line-height: 1.4;
  color: #333;
}

.note-text {
  font-size: 15px;
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap; /* 保留换行符 */
}

.date-location {
  margin-top: 15px;
  font-size: 12px;
  color: #999;
  display: flex;
  gap: 10px;
}

/* 3. 底部固定操作栏 */
.interaction-footer {
  padding: 15px 20px;
  border-top: 1px solid #f6f6f6;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.icons-wrapper {
  display: flex;
  justify-content: space-between;
  padding: 0 10px;
}

.icon-item {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  color: #333;
  transition: all 0.2s;
}

.icon-item:hover {
  color: #3caaff;
}

.icon-item.is-active {
  color: #ff2442;
}

.icon-item.is-active:hover {
  opacity: 0.8;
}

.count {
  font-size: 13px;
  font-weight: 500;
}

/* 覆盖 Element Dialog 默认样式 */
:deep(.note-detail-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

:deep(.note-detail-dialog .el-dialog__header) {
  display: none; /* 隐藏默认头部 */
}

:deep(.note-detail-dialog .el-dialog__body) {
  padding: 0; /* 去除内边距 */
  margin: 0;
}

/* 1. 核心布局：设置弹窗整体高度 */
.modal-content {
  display: flex;
  /* 关键点：使用 vh (视口高度)。85vh 意味着占屏幕高度的 85%，非常大 */
  height: 85vh;
  background: #fff;
  border-radius: 4px;
  overflow: hidden;
}

/* 2. 左侧媒体区：必须撑满父容器高度 */
.media-container {
  width: 65%;
  height: 100%; /* 继承 modal-content 的 85vh */
  background-color: #ffffff; /* 黑色背景，类似小红书/Instagram */
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center; /* 垂直居中 */
}

/* 3. 轮播图内部容器 */
/* Element Plus 的轮播组件默认样式可能需要穿透修正 */
:deep(.el-carousel) {
  width: 100%;
  height: 100%; /* 强制轮播组件撑满 media-container */
}

.image-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel-image {
  /* 关键点：让图片尽可能大，但不要变形 */
  width: 100%;
  height: 100%;
  object-fit: contain; /* 保持比例，完整显示在框内 (会有留白) */
  /* 如果你想占满不留白（可能会被裁剪），改成 object-fit: cover */
  display: block;
}

/* 核心布局 */
.modal-content {
  display: flex;
  height: 85vh; /* 弹窗高度，让图片有足够空间 */
  background: #fff;
  border-radius: 4px;
  overflow: hidden;
}

/* 左侧：媒体区 */
.media-container {
  width: 65%;
  height: 100%; /* 继承父元素高度 */
  background-color: #000; /* 黑色背景 */
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center; /* 垂直居中 */
}

/* 轮播图内部容器 */
:deep(.el-carousel) {
  width: 100%;
  height: 100%;
}

/* 图片包装器：使用 Flexbox 实现水平和垂直居中 */
.image-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: contain; /* 保证图片完整显示且不变形 */
  display: block;
}

:deep(.note-detail-modal.el-dialog) {
  border-radius: 18px;
  overflow: hidden;
}

:deep(.note-detail-modal.el-dialog .el-dialog__body) {
  padding: 0;
}
</style>
