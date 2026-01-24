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
          <el-button type="danger" round size="small" plain>关注</el-button>
        </div>

        <div class="scroll-content">
          <h1 class="note-title">{{ noteData.title }}</h1>
          <div class="note-text">{{ noteData.content }}</div>

          <div class="date-location">
            <span>{{ formatDate(noteData.createTime) }}</span>
            <span v-if="noteData.userVO?.region" class="location">{{ noteData.userVO.region }}</span>
          </div>

          <el-divider />

          <div class="comments-section">
            <div class="total-comments">共 {{ noteData.comments || 0 }} 条评论</div>
            <div class="comment-placeholder">
              <el-empty description="暂无评论，快来抢沙发" :image-size="60" />
            </div>
          </div>
        </div>

        <div class="interaction-footer">
          <div class="input-wrapper">
            <el-input v-model="commentText" placeholder="说点什么..." class="comment-input">
              <template #suffix>
                <el-button type="primary" link @click="sendComment">发送</el-button>
              </template>
            </el-input>
          </div>
          <div class="icons-wrapper">
            <div class="icon-item">
              <el-icon :size="24"><Star /></el-icon>
              <span class="count">{{ noteData.likes || 0 }}</span>
            </div>
            <div class="icon-item">
              <el-icon :size="24"><CollectionTag /></el-icon>
              <span class="count">{{ noteData.favs || 0 }}</span>
            </div>
            <div class="icon-item">
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
import { NoteAPI } from '@/utils/api.ts' // 建议安装 dayjs 格式化时间

const props = defineProps<{
  visible: boolean
  noteId: string // 接收父组件传来的ID
}>()

const emit = defineEmits(['update:visible'])

const visible = ref(false)
const loading = ref(false)
const commentText = ref('')
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

// 定义数据结构
const noteData = ref<any>({
  imageUrls: [], // 确保轮播图一开始是个空数组，而不是 undefined
  userVO: {},
  title: '',
  content: '',
  likes: 0,
  favs: 0,
  comments: 0
})

// 监听 props 变化
watch(() => props.visible, (val) => {
  visible.value = val
  if (val && props.noteId) {
    fetchNoteDetail(props.noteId)
  }
})

watch(visible, (val) => {
  emit('update:visible', val)
})

const handleClose = () => {
  visible.value = false
}



// 模拟获取详情接口
const fetchNoteDetail = async (id: string) => {
  loading.value = true
  try {
    // 1. 发起真实请求
    const res = await NoteAPI.getDetail(id)

    // 2. 判断业务状态码 (假设 code === 0 为成功)
    if (res.code === 0 && res.data) {
      // 3. 赋值给响应式数据
      // 注意：后端接口目前缺 likes, favs, comments 字段，这里手动补 0 防止页面显示异常
      noteData.value = {
        ...res.data,
        likes: (res.data as any).likes || 0,       // 后端未返回，暂定为 0
        favs: (res.data as any).favs || 0,         // 后端未返回，暂定为 0
        comments: (res.data as any).comments || 0, // 后端未返回，暂定为 0
        // 确保 userVO 存在，防止报错
        userVO: res.data.userVO || {}
      }
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
  // 简单格式化，如果没装 dayjs 可以用 new Date().toLocaleDateString()
  return dayjs(time).format('MM-DD HH:mm')
}

const sendComment = () => {
  if(!commentText.value) return
  console.log('发送评论:', commentText.value)
  commentText.value = ''
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
  border-left: 1px solid #f0f0f0;
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
  color: #ff2442; /* 小红书红 */
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
  align-items: center;    /* 垂直居中 */
  justify-content: center; /* 水平居中 */
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: contain; /* 保证图片完整显示且不变形 */
  display: block;
}

</style>
